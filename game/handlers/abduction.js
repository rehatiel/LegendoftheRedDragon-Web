// Abduction event — fires on inn retire (5% chance)
// Player wakes in a dungeon, stripped of gear, must fight bare-handed to escape

const { getPlayer, updatePlayer } = require('../../db');
const {
  getAbductionDungeonScreen,
  getAbductionFightScreen,
  getAbductionEscapeScreen,
} = require('../engine');

// Town-specific captor flavor
const TOWN_CAPTORS = {
  dawnmark:       { type: 'Sellsword',         grunts: ['Hired Thug', 'Cutthroat', 'Sellsword'] },
  stormwatch:     { type: 'Stormwatch Raider', grunts: ['Raider', 'Pillager', 'Brigand'] },
  ironhold:       { type: 'Ironhold Deserter', grunts: ['Deserter', 'Renegade Guard', 'Turncoat'] },
  old_karth:      { type: 'Karth Cultist',     grunts: ['Cultist', 'Zealot', 'Fanatic'] },
  thornreach:     { type: 'Thornreach Bandit',  grunts: ['Bandit', 'Highwayman', 'Footpad'] },
  silverkeep:     { type: 'Guild Enforcer',    grunts: ['Enforcer', 'Guild Thug', 'Collector'] },
  velmora:        { type: 'Velmoran Spy',       grunts: ['Spy', 'Agent', 'Shadow'] },
  bracken_hollow: { type: 'Hollow Poacher',    grunts: ['Poacher', 'Trapper', 'Hunter'] },
  duskveil:       { type: 'Duskveil Smuggler', grunts: ['Smuggler', 'Dockhand', 'Fence'] },
  graveport:      { type: 'Graveport Pirate',  grunts: ['Pirate', 'Buccaneer', 'Corsair'] },
  mirefen:        { type: 'Mirefen Witch-Bind', grunts: ['Swamp Lurker', 'Bogwalker', 'Grim'] },
  ashenfall:      { type: 'Ashen Inquisitor',  grunts: ['Inquisitor', 'Warden', 'Keeper'] },
  frostmere:      { type: 'Frostmere Raider',  grunts: ['Raider', 'Frost Guard', 'Ice Warden'] },
};

function rollDice(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function rollCaptor(level, name) {
  const hp = rollDice(level * 12, level * 22);
  const atk = rollDice(level * 5, level * 12);
  return { name, maxHp: hp, currentHp: hp, attack: atk };
}

// Called from inn_retire when the 5% abduction fires
function startAbduction(player) {
  const town = player.current_town || 'dawnmark';
  const def = TOWN_CAPTORS[town] || TOWN_CAPTORS.dawnmark;
  const count = rollDice(2, 4);
  const grunts = Array.from({ length: count - 1 }, () => {
    const name = def.grunts[Math.floor(Math.random() * def.grunts.length)];
    return rollCaptor(player.level, name);
  });
  const leader = rollCaptor(Math.ceil(player.level * 1.3), def.type);
  const captors = [...grunts, leader]; // fight grunts first, leader last
  const goldReward = count * player.level * 35;

  const state = { captors, captorsDefeated: 0, captorType: def.type, goldReward };
  const screen = getAbductionDungeonScreen(player, captors[0].name, count);
  return { state, screen };
}

// Bare-hands combat — player fights stripped of gear bonuses
function bareHandsAttack(player, multiplier = 1.0) {
  const atk = rollDice(1, Math.max(1, Math.floor(player.strength * 0.45)));
  return Math.floor(atk * multiplier);
}

function bareHandsDefense(player) {
  return Math.max(0, Math.floor(player.defense * 0.3));
}

function applyDefense(raw, defense) {
  return Math.max(1, raw - Math.floor(defense * 0.4));
}

// Power move multipliers by class
const POWER_MULT = { 1: 3.0, 2: 2.5, 3: 2.0 };
const POWER_NAMES = { 1: 'Fatal Strike', 2: 'Lightning Bolt', 3: 'Backstab' };

// Shared fight logic
async function resolveFightRound(player, req, res, pendingMessages, playerMultiplier, actionLabel) {
  const state = req.session.abduction;
  if (!state || !state.captors || state.captors.length === 0) {
    return res.json({ ...getAbductionEscapeScreen(player, 0, 'unknown'), pendingMessages });
  }

  const captor = state.captors[0];
  const log = [];

  // Player attacks
  const pAtk = bareHandsAttack(player, playerMultiplier);
  const pDef = bareHandsDefense(player);
  captor.currentHp -= pAtk;
  log.push({ text: `\`0You ${actionLabel} the ${captor.name} for \`$${pAtk}\`0 damage!` });

  if (captor.currentHp <= 0) {
    // Defeated this captor
    state.captors.shift();
    state.captorsDefeated += 1;
    log.push({ text: `\`0The ${captor.name} crumples to the ground!` });

    if (state.captors.length === 0) {
      // All captors defeated — escape!
      const goldGained = state.goldReward;
      await updatePlayer(player.id, {
        gold: Number(player.gold) + goldGained,
        retired_today: 0,
        retired_town: '',
      });
      player = await getPlayer(player.id);
      delete req.session.abduction;
      return res.json({ ...getAbductionEscapeScreen(player, goldGained, state.captorType), pendingMessages: [...pendingMessages, ...log.map(l => l.text)] });
    }

    // More captors remain — show fight screen for next one
    req.session.abduction = state;
    return res.json({
      ...getAbductionFightScreen(player, state.captors[0], log, state.captorsDefeated, state.captorsDefeated + state.captors.length),
      pendingMessages,
    });
  }

  // Captor counterattacks
  const mAtk = applyDefense(rollDice(1, captor.attack), pDef);
  const newHp = Math.max(0, player.hit_points - mAtk);
  await updatePlayer(player.id, { hit_points: newHp });
  player = await getPlayer(player.id);
  log.push({ text: `\`@The ${captor.name} strikes back for \`@${mAtk}\`% damage!` });

  if (newHp <= 0) {
    // Player died — near death, end abduction
    await updatePlayer(player.id, { near_death: 1, retired_today: 0, retired_town: '' });
    player = await getPlayer(player.id);
    delete req.session.abduction;
    return res.json({
      screen: 'near_death',
      title: 'Defeated!',
      lines: [
        `\`@You collapse under the blows of the ${captor.name}.`,
        '',
        `\`7You wake alone on the street outside the inn. Beaten. Robbed. Barely alive.`,
      ],
      choices: [{ key: 'L', label: 'Continue', action: 'town' }],
      pendingMessages,
    });
  }

  req.session.abduction = state;
  return res.json({
    ...getAbductionFightScreen(player, captor, log, state.captorsDefeated, state.captorsDefeated + state.captors.length),
    pendingMessages,
  });
}

async function abduction_fight({ player, req, res, pendingMessages }) {
  return resolveFightRound(player, req, res, pendingMessages, 1.0, 'strike');
}

async function abduction_power({ player, req, res, pendingMessages }) {
  const mult = POWER_MULT[player.class] || 1.5;
  const name = POWER_NAMES[player.class] || 'Power Strike';
  return resolveFightRound(player, req, res, pendingMessages, mult, name);
}

async function abduction_run({ player, req, res, pendingMessages }) {
  const state = req.session.abduction;
  if (!state) return res.json({ screen: 'town', title: 'Town', lines: [], choices: [], pendingMessages });

  const hpRatio = player.hit_points / Math.max(1, player.hit_max);
  let fleeChance = 0.20;
  if (hpRatio < 0.25) fleeChance = 0.35;
  if (player.class === 3) fleeChance += 0.10;

  if (Math.random() < fleeChance) {
    await updatePlayer(player.id, { retired_today: 0, retired_town: '' });
    delete req.session.abduction;
    const lines = [
      `\`3You find a gap in the guard rotation and bolt for the door!`,
      '',
      `\`7You tumble out into the alley, panting. You escaped — but with nothing to show for it.`,
    ];
    return res.json({ screen: 'town', title: 'Escaped Bare-Handed', lines, choices: [{ key: 'L', label: 'Return to town', action: 'town' }], pendingMessages });
  }

  // Failed to flee — captor gets a free hit
  const captor = state.captors[0];
  const pDef = bareHandsDefense(player);
  const mAtk = applyDefense(rollDice(1, captor.attack), pDef);
  const newHp = Math.max(0, player.hit_points - mAtk);
  await updatePlayer(player.id, { hit_points: newHp });
  player = await getPlayer(player.id);

  const log = [
    { text: `\`7You look for an opening to run, but ${captor.name} cuts you off!` },
    { text: `\`@${captor.name} strikes you for \`@${mAtk}\`% damage as you scramble back!` },
  ];

  if (newHp <= 0) {
    await updatePlayer(player.id, { near_death: 1, retired_today: 0, retired_town: '' });
    delete req.session.abduction;
    return res.json({
      screen: 'near_death',
      title: 'Defeated!',
      lines: [
        `\`@You collapse, unable to escape.`,
        `\`7You wake alone outside the inn. Beaten. Barely alive.`,
      ],
      choices: [{ key: 'L', label: 'Continue', action: 'town' }],
      pendingMessages,
    });
  }

  req.session.abduction = state;
  return res.json({
    ...getAbductionFightScreen(player, captor, log, state.captorsDefeated, state.captorsDefeated + state.captors.length),
    pendingMessages,
  });
}

module.exports = { startAbduction, abduction_fight, abduction_power, abduction_run };
