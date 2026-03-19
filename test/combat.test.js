const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveRound, resolvePvP } = require('../game/combat');

// Minimal player/monster stubs
function makePlayer(overrides = {}) {
  return {
    id: 1, handle: 'TestHero', class: 1,
    hit_points: 100, hit_max: 100,
    strength: 50, defense: 20,
    weapon_name: 'Sword', weapon_num: 1, arm_num: 1,
    skill_uses_left: 3, skill_points: 3,
    poisoned: 0, rage_active: 0,
    ...overrides,
  };
}

function makeMonster(overrides = {}) {
  return {
    name: 'Goblin', weapon: 'Club',
    strength: 20, defense: 5,
    hp: 50, maxHp: 50, currentHp: 50,
    gold: 10, exp: 20,
    behavior: 'normal',
    ...overrides,
  };
}

describe('applyDefense (via resolveRound)', () => {
  it('monster never deals 0 damage — minimum 1', () => {
    // High-defense player vs weak monster: damage should still be >= 1
    const p = makePlayer({ defense: 9999 });
    const m = makeMonster({ strength: 1, behavior: 'normal' });
    m.currentHp = 9999; // ensure monster survives player hit
    const { monsterDamage } = resolveRound(p, m, 'attack');
    assert.ok(monsterDamage >= 1, `monsterDamage should be >= 1, got ${monsterDamage}`);
  });

  it('player never deals 0 damage — minimum 1', () => {
    const p = makePlayer({ strength: 1 });
    const m = makeMonster({ defense: 9999, currentHp: 9999 });
    const { playerDamage } = resolveRound(p, m, 'attack');
    assert.ok(playerDamage >= 1, `playerDamage should be >= 1, got ${playerDamage}`);
  });
});

describe('resolveRound — run action', () => {
  it('fled=true means no player damage dealt', () => {
    // Run many trials — at least one should flee with 0 player damage
    let didFlee = false;
    for (let i = 0; i < 200; i++) {
      const result = resolveRound(makePlayer(), makeMonster(), 'run');
      if (result.fled) {
        assert.equal(result.playerDamage, 0);
        didFlee = true;
        break;
      }
    }
    assert.ok(didFlee, 'Expected at least one successful flee in 200 attempts');
  });

  it('returns a log array', () => {
    const result = resolveRound(makePlayer(), makeMonster(), 'run');
    assert.ok(Array.isArray(result.log));
    assert.ok(result.log.length > 0);
  });
});

describe('resolveRound — poison', () => {
  it('poisoned player takes poison damage each round', () => {
    const p = makePlayer({ poisoned: 2 });
    const m = makeMonster({ currentHp: 9999 });
    const result = resolveRound(p, m, 'attack');
    assert.ok(result.poisonDamage > 0, 'Poisoned player should take poison damage');
  });

  it('non-poisoned player takes no poison damage', () => {
    const p = makePlayer({ poisoned: 0 });
    const m = makeMonster({ currentHp: 9999 });
    const result = resolveRound(p, m, 'attack');
    assert.equal(result.poisonDamage, 0);
  });
});

describe('resolveRound — aggressive monster', () => {
  it('attacks twice (higher total monster damage on average)', () => {
    const normal = makeMonster({ behavior: 'normal', currentHp: 9999 });
    const aggressive = makeMonster({ behavior: 'aggressive', currentHp: 9999 });
    let normalTotal = 0, aggressiveTotal = 0;
    const TRIALS = 500;
    for (let i = 0; i < TRIALS; i++) {
      normalTotal    += resolveRound(makePlayer(), { ...normal }, 'attack').monsterDamage;
      aggressiveTotal += resolveRound(makePlayer(), { ...aggressive }, 'attack').monsterDamage;
    }
    assert.ok(aggressiveTotal > normalTotal,
      `Aggressive (${aggressiveTotal}) should deal more damage than normal (${normalTotal}) over ${TRIALS} trials`);
  });
});

describe('resolveRound — venomous monster', () => {
  it('can apply poison', () => {
    const m = makeMonster({ behavior: 'venomous', currentHp: 9999 });
    let poisoned = false;
    for (let i = 0; i < 300; i++) {
      if (resolveRound(makePlayer(), { ...m }, 'attack').appliedPoison) { poisoned = true; break; }
    }
    assert.ok(poisoned, 'Venomous monster should apply poison within 300 rounds');
  });
});

describe('resolvePvP', () => {
  it('returns a boolean winner', () => {
    const a = makePlayer({ handle: 'Alice', strength: 80 });
    const b = makePlayer({ handle: 'Bob',   strength: 10 });
    const { attackerWon, log } = resolvePvP(a, b);
    assert.equal(typeof attackerWon, 'boolean');
    assert.ok(Array.isArray(log));
  });

  it('stronger attacker wins more often', () => {
    let wins = 0;
    const TRIALS = 200;
    for (let i = 0; i < TRIALS; i++) {
      const { attackerWon } = resolvePvP(
        makePlayer({ handle: 'Strong', strength: 200, defense: 50 }),
        makePlayer({ handle: 'Weak',   strength: 10,  defense: 0  }),
      );
      if (attackerWon) wins++;
    }
    assert.ok(wins > 150, `Strong attacker should win >75% of fights, won ${wins}/${TRIALS}`);
  });

  it('terminates within 50 rounds (no infinite loop)', () => {
    // If the loop ran forever this test would hang
    const result = resolvePvP(
      makePlayer({ strength: 1, defense: 9999 }),
      makePlayer({ strength: 1, defense: 9999 }),
    );
    assert.ok(result.log.length <= 50);
  });
});
