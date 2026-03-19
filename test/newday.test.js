const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

// Mock db.addNews so newday.js doesn't need a real DB connection
const db = require('../db');
mock.method(db, 'addNews', async () => {});

const { runNewDay, checkLevelUp } = require('../game/newday');

function makePlayer(overrides = {}) {
  return {
    id: 1, handle: 'TestHero', class: 1,
    level: 5, exp: 0,
    hit_points: 80, hit_max: 100,
    strength: 50, defense: 20,
    gold: 1000, bank: 500, bank: 500,
    skill_points: 3, skill_uses_left: 2,
    fights_left: 0, human_fights_left: 0,
    stamina: 0, training_today: 5, drinks_today: 3,
    flirted_today: 1, special_done_today: 1,
    rage_active: 1,
    dead: 0, near_death: 0, near_death_by: '',
    poisoned: 0,
    married_to: -1, kids: 0,
    ...overrides,
  };
}

describe('runNewDay — daily resets', () => {
  it('resets stamina to 10', async () => {
    const { updates } = await runNewDay(makePlayer({ stamina: 0 }));
    assert.equal(updates.stamina, 10);
  });

  it('resets fights_left to 10', async () => {
    const { updates } = await runNewDay(makePlayer());
    assert.equal(updates.fights_left, 10);
  });

  it('resets human_fights_left to 5', async () => {
    const { updates } = await runNewDay(makePlayer());
    assert.equal(updates.human_fights_left, 5);
  });

  it('resets training_today, drinks_today, flirted_today', async () => {
    const { updates } = await runNewDay(makePlayer());
    assert.equal(updates.training_today, 0);
    assert.equal(updates.drinks_today, 0);
    assert.equal(updates.flirted_today, 0);
  });

  it('resets rage_active', async () => {
    const { updates } = await runNewDay(makePlayer({ rage_active: 1 }));
    assert.equal(updates.rage_active, 0);
  });
});

describe('runNewDay — healing', () => {
  it('heals alive player by 25% of max HP', async () => {
    const p = makePlayer({ hit_points: 50, hit_max: 100 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.hit_points, 75); // 50 + 25% of 100
  });

  it('does not overheal above hit_max', async () => {
    const p = makePlayer({ hit_points: 95, hit_max: 100 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.hit_points, 100);
  });
});

describe('runNewDay — bank interest', () => {
  it('pays 5% interest on bank balance', async () => {
    const p = makePlayer({ bank: 1000 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.bank, 1050);
  });

  it('caps interest at 10000 gold per day', async () => {
    const p = makePlayer({ bank: 1_000_000 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.bank, 1_010_000); // only 10k added, not 50k
  });

  it('no interest on zero bank balance', async () => {
    const p = makePlayer({ bank: 0 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.bank, undefined); // no bank update
  });
});

describe('runNewDay — death penalty', () => {
  it('dead player loses 50% gold on revival', async () => {
    const p = makePlayer({ dead: 1, gold: 1000 });
    const { updates, messages } = await runNewDay(p);
    assert.equal(updates.gold, 500);
    assert.ok(messages.some(m => m.includes('reincarnated')));
  });

  it('dead player above level 1 loses a level', async () => {
    const p = makePlayer({ dead: 1, level: 3 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.level, 2);
  });

  it('dead player at level 1 does not lose a level', async () => {
    const p = makePlayer({ dead: 1, level: 1 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.level, undefined);
  });

  it('revived player has dead reset to 0', async () => {
    const p = makePlayer({ dead: 1 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.dead, 0);
  });
});

describe('runNewDay — poison', () => {
  it('poison count decreases by 1 overnight', async () => {
    const p = makePlayer({ poisoned: 3 });
    const { updates } = await runNewDay(p);
    assert.equal(updates.poisoned, 2);
  });

  it('poison reaching 0 triggers a cure message', async () => {
    const p = makePlayer({ poisoned: 1 });
    const { updates, messages } = await runNewDay(p);
    assert.equal(updates.poisoned, 0);
    assert.ok(messages.some(m => m.includes('poison')));
  });
});

describe('runNewDay — near death expiry', () => {
  it('near-death player with no rescuer dies overnight', async () => {
    const p = makePlayer({ near_death: 1, near_death_by: 'Goblin' });
    const { updates, messages } = await runNewDay(p);
    assert.equal(updates.dead, 1);
    assert.equal(updates.near_death, 0);
    assert.ok(messages.some(m => m.includes('rescue') || m.includes('perished')));
  });
});

describe('checkLevelUp', () => {
  it('returns null when not enough exp', () => {
    const p = makePlayer({ level: 1, exp: 0 });
    assert.equal(checkLevelUp(p), null);
  });

  it('returns level-up data when exp threshold met', () => {
    // Level 1 requires 100 exp
    const p = makePlayer({ level: 1, exp: 100 });
    const result = checkLevelUp(p);
    assert.ok(result !== null);
    assert.equal(result.newLevel, 2);
    assert.ok(result.hpGain > 0);
    assert.ok(result.strGain > 0);
  });

  it('returns null at max level (12)', () => {
    const p = makePlayer({ level: 12, exp: 9_999_999 });
    assert.equal(checkLevelUp(p), null);
  });

  it('level-up updates include all required fields', () => {
    const p = makePlayer({ level: 1, exp: 100 });
    const result = checkLevelUp(p);
    assert.ok('level' in result.updates);
    assert.ok('hit_max' in result.updates);
    assert.ok('hit_points' in result.updates);
    assert.ok('strength' in result.updates);
    assert.ok('skill_points' in result.updates);
  });
});
