// The Warden's Fall — post-dragon questline.
// The Red Dragon was the last Warden, sealing The Veilborn beneath the mountain.
// The player killed the dragon and unwittingly freed it. This quest is their reckoning.
//
// Quest steps (quest_id = 'wardens_fall', quest_step 1-7):
//   1 — Talk to Scholar Voss in Dawnmark
//   2 — Talk to Captain Ralen in Ironhold
//   3 — Talk to Archivist Thessaly in Stormwatch
//   4 — Fight the Pale Captain on the ghost ship in Graveport
//   5 — Visit the Ancient Forge in Ashenfall
//   6 — Final stand: fight The Veilborn in Dawnmark
//   7 — Complete

const { getPlayer, updatePlayer, addNews } = require('../../db');
const { getTownScreen, renderBanner } = require('../engine');
const { resolveRound } = require('../combat');
const { buildTitleAward } = require('../titles');
const { NAMED_ITEMS } = require('../data');

// ── Veilborn boss stats ───────────────────────────────────────────────────────
const THE_VEILBORN = {
  name:     'The Veilborn',
  weapon:   'void tendrils',
  hp:       3000, maxHp: 3000, currentHp: 3000,
  strength: 550,
  gold:     2000000,
  exp:      4000000,
  meet:     'The air tears open like wet paper. A shape that is not a shape claws its way through — formless, vast, and hungry. When it speaks it sounds like your own voice turned inside-out. "YOU FREED ME. THAT WAS EITHER COURAGE OR STUPIDITY. I HAVE NOT DECIDED WHICH."',
  death:    'The Veilborn shudders. The rift contracts. With a sound like the world exhaling, the darkness collapses inward. The Warden\'s Seal burns white, then goes cold in your hand. It is done. The world will not know what it owes you.',
  fleeLine: 'The Veilborn does not pursue. "YOU WILL RETURN," it says. "THERE IS NO OTHER CHOICE."',
};

// The Pale Captain — step 4 ghost ship fight (stored in session.combat like a normal fight)
const PALE_CAPTAIN = {
  name:     'The Pale Captain',
  weapon:   'spectral blade',
  hp:       900, maxHp: 900, currentHp: 900,
  strength: 280,
  gold:     0,
  exp:      25000,
  isVeilbornCaptain: true,  // flag read by forest.js kill handler to advance quest
  meet:     'A figure resolves from the fog of the ghost ship — armour green with sea-growth, eyes like drowned lanterns. "THIS SHIP BELONGS TO THE DEAD," it rasps. "AND YOU WILL JOIN THEM."',
  death:    'The Pale Captain staggers. The spectral light in its eyes dims. "...At last," it whispers, and dissolves.',
};

// ── Step 1 — Scholar Voss in Dawnmark ────────────────────────────────────────
async function veilborn_scholar({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 1)
    return res.json({ ...getTownScreen(player), pendingMessages });

  return res.json({
    screen: 'veilborn_scholar',
    title:  "Scholar Voss",
    lines: [
      '`8  ══════════════════════════════════════',
      '`7      THE WARDEN\'S FALL — Part I',
      '`8  ══════════════════════════════════════',
      '',
      '`%  A pale, frantic scholar intercepts you at the town gate.',
      '',
      '`7  "You there. The dragon — it\'s dead, isn\'t it."',
      '`7  It is not a question.',
      '',
      '`7  "I\'ve been watching the Warden\'s Eye for years. When it',
      '`7  went dark... I knew. You don\'t understand what you\'ve done."',
      '',
      '`7  "The Red Dragon wasn\'t a monster. It was the LAST WARDEN —',
      '`7  one of the old guardians who sealed The Veilborn beneath',
      '`7  the mountain 800 years ago. The Seal requires a living',
      '`7  life-force. The dragon\'s burning, ancient life-force."',
      '',
      '`7  "It\'s gone now. The Veilborn is already pushing through',
      '`7  the rift. You have days. Perhaps less."',
      '',
      '`7  "A new Seal CAN be forged — but only from Warden Steel,',
      '`7  only at the Ancient Forge in Ashenfall. I need intelligence',
      '`7  first. Go to Ironhold. If The Veilborn\'s shadows have',
      '`7  reached the front lines, the military will have reports."',
      '',
      '`8  Voss presses a rolled parchment into your hands. His fingers are cold.',
      '',
      '`$  [A]`% Accept — travel to Ironhold',
    ],
    choices: [{ key: 'A', label: 'Accept — travel to Ironhold', action: 'veilborn_scholar_accept' }],
    pendingMessages,
  });
}

async function veilborn_scholar_accept({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 1)
    return res.json({ ...getTownScreen(player), pendingMessages });

  await updatePlayer(player.id, {
    quest_step: 2,
    quest_data: JSON.stringify({ target: 'ironhold' }),
  });
  player = await getPlayer(player.id);
  return res.json({ ...getTownScreen(player), pendingMessages: [
    '`7Voss watches you go. He does not look hopeful.',
    '`$Quest: The Warden\'s Fall — "Travel to Ironhold. Find Captain Ralen."',
  ]});
}

// ── Step 2 — Captain Ralen in Ironhold ───────────────────────────────────────
async function veilborn_ironhold({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 2)
    return res.json({ ...getTownScreen(player), pendingMessages });

  return res.json({
    screen: 'veilborn_ironhold',
    title:  "Captain Ralen",
    lines: [
      '`8  ══════════════════════════════════════',
      '`7      THE WARDEN\'S FALL — Part II',
      '`8  ══════════════════════════════════════',
      '',
      '`%  Captain Ralen meets you in the war-room, maps spread across the table.',
      '`%  There are burn marks on the maps that shouldn\'t be there.',
      '',
      '`7  "You\'re the one who killed the dragon." A statement. No praise.',
      '',
      '`7  "We\'ve been fighting shadows for three days. Not metaphor —',
      '`7  actual shadows. They don\'t bleed. They don\'t die.',
      '`7  They just... dissolve and come back."',
      '',
      '`7  "The old texts call something like this a \'void incursion.\'',
      '`7  I thought it was myth. The Stormwatch Archivist has the',
      '`7  relevant records — she\'s been cataloguing this."',
      '',
      '`7  He stamps the parchment with the Ironhold seal.',
      '`7  "Take this to Thessaly. Tell her what you told me."',
      '',
      '`0  You receive: Captain\'s Dispatch.',
      '',
      '`$  [A]`% Take the dispatch — travel to Stormwatch',
    ],
    choices: [{ key: 'A', label: 'Take the dispatch — travel to Stormwatch', action: 'veilborn_ironhold_accept' }],
    pendingMessages,
  });
}

async function veilborn_ironhold_accept({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 2)
    return res.json({ ...getTownScreen(player), pendingMessages });

  await updatePlayer(player.id, {
    quest_step: 3,
    quest_data: JSON.stringify({ target: 'stormwatch', dispatch: true }),
  });
  player = await getPlayer(player.id);
  return res.json({ ...getTownScreen(player), pendingMessages: [
    '`7The soldiers watch you leave. None of them speak.',
    '`$Quest: The Warden\'s Fall — "Travel to Stormwatch. Find Archivist Thessaly."',
  ]});
}

// ── Step 3 — Archivist Thessaly in Stormwatch ────────────────────────────────
async function veilborn_stormwatch({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 3)
    return res.json({ ...getTownScreen(player), pendingMessages });

  return res.json({
    screen: 'veilborn_stormwatch',
    title:  "Archivist Thessaly",
    lines: [
      '`8  ══════════════════════════════════════',
      '`7      THE WARDEN\'S FALL — Part III',
      '`8  ══════════════════════════════════════',
      '',
      '`%  The Archivist is surrounded by floating spheres of contained light,',
      '`%  each one a sealed record. She doesn\'t look up when you enter.',
      '',
      '`7  "The Veilborn. Yes. I\'ve been expecting someone."',
      '',
      '`7  She pulls a sphere from the air. Inside, a map — old, strange.',
      '',
      '`7  "The first Wardens sealed it using a resonant life-force. The',
      '`7  dragon provided continuity. Now the vessel is gone."',
      '',
      '`7  "A new Seal can be forged from Warden Steel — but only by',
      '`7  someone who CAUSED the breach. That\'s you, I\'m afraid."',
      '',
      '`7  "The last Warden\'s journal is the key. The Pale Captain carried it.',
      '`7  When their ship went down off Graveport, the captain never quite...\'',
      '`7  let go. The journal is still aboard. Find the ghost ship."',
      '',
      '`8  She looks at you with something between pity and curiosity.',
      '`8  "The dragon chose this, you know. It had been waiting for a',
      '`8  warrior worthy of the burden. Whether you\'re worthy remains to be seen."',
      '',
      '`$  [A]`% Travel to Graveport — find the ghost ship',
    ],
    choices: [{ key: 'A', label: 'Travel to Graveport — find the ghost ship', action: 'veilborn_stormwatch_accept' }],
    pendingMessages,
  });
}

async function veilborn_stormwatch_accept({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 3)
    return res.json({ ...getTownScreen(player), pendingMessages });

  await updatePlayer(player.id, {
    quest_step: 4,
    quest_data: JSON.stringify({ target: 'graveport', dispatch: true }),
  });
  player = await getPlayer(player.id);
  return res.json({ ...getTownScreen(player), pendingMessages: [
    '`8Thessaly watches you go. The spheres around her flicker.',
    '`$Quest: The Warden\'s Fall — "Travel to Graveport. Board the ghost ship."',
  ]});
}

// ── Step 4 — Ghost Ship in Graveport ─────────────────────────────────────────
async function veilborn_graveport({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 4)
    return res.json({ ...getTownScreen(player), pendingMessages });

  return res.json({
    screen: 'veilborn_graveport',
    title:  "The Ghost Ship",
    lines: [
      '`8  ══════════════════════════════════════',
      '`7      THE WARDEN\'S FALL — Part IV',
      '`8  ══════════════════════════════════════',
      '',
      '`%  At the docks, one ship sits apart from the others.',
      '`%  It shouldn\'t be there. It wasn\'t there yesterday.',
      '`%  The fishermen cross themselves and look away.',
      '',
      '`7  The gangplank lowers on its own.',
      '`7  The fog thickens.',
      '',
      '`8  ' + PALE_CAPTAIN.meet,
      '',
      '`@  The Pale Captain blocks the way to the Captain\'s Quarters.',
      '`@  The journal is behind it.',
      '',
      '`$  [F]`% Fight the Pale Captain!',
    ],
    choices: [{ key: 'F', label: 'Fight the Pale Captain!', action: 'veilborn_graveport_fight' }],
    pendingMessages,
  });
}

async function veilborn_graveport_fight({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 4)
    return res.json({ ...getTownScreen(player), pendingMessages });

  // Use the standard forest combat system — store monster in session.combat
  const captain = { ...PALE_CAPTAIN, currentHp: PALE_CAPTAIN.hp };
  req.session.combat = { monster: captain, round: 1, history: [] };
  req.session.forestDepth = 0;

  const { getForestEncounterScreen } = require('../engine');
  return res.json({
    ...getForestEncounterScreen(player, captain),
    pendingMessages: [...pendingMessages, '`@A chill runs up your spine as you step aboard...'],
  });
}

// ── Step 5 — Ancient Forge in Ashenfall ──────────────────────────────────────
async function veilborn_ashenfall({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 5)
    return res.json({ ...getTownScreen(player), pendingMessages });

  return res.json({
    screen: 'veilborn_ashenfall',
    title:  "The Ancient Forge",
    lines: [
      '`8  ══════════════════════════════════════',
      '`7      THE WARDEN\'S FALL — Part V',
      '`8  ══════════════════════════════════════',
      '',
      '`%  The Ancient Forge is older than the city built around it.',
      '`%  Its coals have been cold for 200 years — until now.',
      '`%  They burn white-hot as you approach, as if waiting.',
      '',
      '`7  You open the journal. The last entry reads:',
      '',
      '`8  "The dragon will not live forever. When it falls — and it will',
      '`8  fall, by the hand of someone worthy — the next Seal must be',
      '`8  forged not from metal alone, but from the will of the one',
      '`8  who caused the breach. They carry the dragon\'s final gift.',
      '`8  They simply don\'t know it yet."',
      '',
      '`7  You lay the journal in the fire. The coals roar.',
      '`7  The forge hammers begin to move on their own.',
      '',
      '`7  When the noise stops, a small iron disc sits on the anvil.',
      '`7  It burns with a light that has no source.',
      '',
      '`0  You have forged the Warden\'s Seal.',
      '',
      '`8  "Go back to where it started," you hear, in a voice like',
      '`8  crackling embers. "Finish what you began."',
      '',
      '`$  [A]`% Take the Seal — return to Dawnmark',
    ],
    choices: [{ key: 'A', label: 'Take the Seal — return to Dawnmark', action: 'veilborn_ashenfall_accept' }],
    pendingMessages,
  });
}

async function veilborn_ashenfall_accept({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 5)
    return res.json({ ...getTownScreen(player), pendingMessages });

  await updatePlayer(player.id, {
    quest_step: 6,
    quest_data: JSON.stringify({ target: 'dawnmark', seal: true }),
  });
  player = await getPlayer(player.id);
  return res.json({ ...getTownScreen(player), pendingMessages: [
    '`7The forge goes dark as you leave. The coals are ash.',
    '`$Quest: The Warden\'s Fall — "Return to Dawnmark. Make your stand."',
  ]});
}

// ── Step 6 — Final Stand in Dawnmark: fight The Veilborn ─────────────────────
async function veilborn_final({ player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 6)
    return res.json({ ...getTownScreen(player), pendingMessages });

  return res.json({
    screen: 'veilborn_final',
    title:  "The Final Stand",
    lines: [
      '`@  ══════════════════════════════════════',
      '`$      THE WARDEN\'S FALL — FINAL ACT',
      '`@  ══════════════════════════════════════',
      '',
      '`%  The sky above Dawnmark has gone the colour of a bruise.',
      '`%  Voss stands at the square\'s edge, pale, not running.',
      '`%  Most others have.',
      '',
      '`7  "It\'s here," he says quietly.',
      '',
      '`@  ' + THE_VEILBORN.meet,
      '',
      '`8  The Warden\'s Seal grows hot in your hand.',
      '`8  You understand now what the dragon was protecting.',
      '`8  You understand what you have to do.',
      '',
      '`@  [F]`% Fight The Veilborn — use the Seal!',
      '`7  [R]`% Flee... (you cannot run from this)',
    ],
    choices: [
      { key: 'F', label: 'Fight The Veilborn!', action: 'veilborn_final_fight' },
      { key: 'R', label: 'Flee',                action: 'veilborn_final_flee' },
    ],
    pendingMessages,
  });
}

async function veilborn_final_flee({ player, req, res, pendingMessages }) {
  // Flavour — you can't actually flee this one
  return res.json({
    screen: 'veilborn_final',
    title:  "The Final Stand",
    lines: [
      '`7  Your feet won\'t move.',
      '`7  Somewhere inside you, the dragon\'s last gift holds you here.',
      '`8  "There is nowhere to go," Voss says. He is right.',
      '',
      '`@  [F]`% Stand and fight.',
    ],
    choices: [{ key: 'F', label: 'Fight!', action: 'veilborn_final_fight' }],
    pendingMessages,
  });
}

async function veilborn_final_fight({ action, player, req, res, pendingMessages }) {
  if (player.quest_id !== 'wardens_fall' || player.quest_step !== 6)
    return res.json({ ...getTownScreen(player), pendingMessages });

  const veilHp = req.session.veilbornCombat ? req.session.veilbornCombat.veilHp : THE_VEILBORN.hp;
  const vb = { ...THE_VEILBORN, currentHp: veilHp, maxHp: THE_VEILBORN.hp };

  // Void Touch: 20% chance to suppress player's power move this round
  const voidTouched = Math.random() < 0.20;
  const effectiveAction = (voidTouched && action === 'veilborn_power') ? 'attack' : 'attack';

  const { playerDamage, monsterDamage, log } = resolveRound(player, vb, effectiveAction);
  vb.currentHp = Math.max(0, vb.currentHp - playerDamage);
  const newHp   = Math.max(0, player.hit_points - monsterDamage);

  await updatePlayer(player.id, { hit_points: newHp });
  player = await getPlayer(player.id);

  // ── Veilborn defeated ─────────────────────────────────────────────────────
  if (vb.currentHp <= 0) {
    req.session.veilbornCombat = null;

    // Award Warden's Champion title + Warden's Edge weapon
    const titleAward = buildTitleAward(player, 'wardens_champion') || {};
    const weaponUpdates = !player.named_weapon_id ? {
      named_weapon_id: 'wardens_edge',
      strength: player.strength + (NAMED_ITEMS.wardens_edge?.strength || 110),
    } : {};

    await updatePlayer(player.id, {
      quest_id:   '',
      quest_step: 7,
      quest_data: JSON.stringify({ complete: true }),
      gold:       Number(player.gold) + THE_VEILBORN.gold,
      exp:        Number(player.exp)  + THE_VEILBORN.exp,
      ...titleAward,
      ...weaponUpdates,
    });
    player = await getPlayer(player.id);

    await addNews(`\`$★ ${player.handle}\`% has sealed the Veilborn and restored the Warden\'s Seal! The world breathes again.`);

    const weaponLine = !player.named_weapon_id
      ? `\`!  You find the \`$Warden's Edge\`! at your feet. It is yours now.`
      : '';

    return res.json({
      screen: 'veilborn_victory',
      title:  'The Seal Holds.',
      lines: [
        '`@  ══════════════════════════════════════',
        '`$        THE SEAL HOLDS',
        '`@  ══════════════════════════════════════',
        '',
        '`%  ' + THE_VEILBORN.death,
        '',
        '`7  The sky over Dawnmark slowly returns to blue.',
        '`7  Voss collapses to his knees in the square.',
        '`7  "You did it. I didn\'t think you could."',
        '`7  He pauses. "The dragon knew. That\'s why it let you kill it."',
        '',
        '`0  The dragon chose you. In the end, it was never a monster.',
        '`0  It was waiting for someone willing to carry the burden forward.',
        '',
        '`$  ★ WARDEN\'S CHAMPION ★',
        `\`%  You have earned the title: \`$the Warden\'s Champion\`%.`,
        `\`%  Gold: \`$+${THE_VEILBORN.gold.toLocaleString()}   \`%Exp: \`$+${THE_VEILBORN.exp.toLocaleString()}`,
        weaponLine,
        '',
        '`8  Voss looks at the empty sky a long time.',
        '`8  "The next threat won\'t be sealed. Just delayed."',
        '`8  He folds his notes and walks away without another word.',
        '',
        '`$  [T]`% Return to Town',
      ].filter(l => l !== undefined),
      choices: [{ key: 'T', label: 'Return to Town', action: 'town' }],
      pendingMessages: [],
    });
  }

  // ── Player defeated ───────────────────────────────────────────────────────
  if (newHp <= 0) {
    req.session.veilbornCombat = null;
    await updatePlayer(player.id, { dead: 1, hit_points: 0 });
    await addNews(`\`@The Veilborn overwhelmed \`$${player.handle}\`@ — the Seal remains unforged!`);
    return res.json({
      screen: 'veilborn_death',
      title:  'Defeated',
      lines: [
        '`@  The Veilborn drives you to the ground.',
        '`@  "RETURN WHEN YOU ARE WORTHY," it says.',
        '`8  The Seal grows cold in your hand.',
        '`%  You have been defeated. The quest remains.',
        '`%  The Veilborn waits for your return.',
        '',
        '`$  [T]`% Return to Town',
      ],
      choices: [{ key: 'T', label: 'Return to Town', action: 'town' }],
      pendingMessages: [],
    });
  }

  // ── Combat continues ──────────────────────────────────────────────────────
  req.session.veilbornCombat = { veilHp: vb.currentHp };
  const hpCol = newHp < player.hit_max * 0.3 ? '@' : '0';
  const voidLine = voidTouched ? '`#Void Touch! The darkness smothers your focus for a moment.' : '';

  return res.json({
    screen: 'veilborn_combat',
    title:  'Fighting The Veilborn!',
    lines: [
      '`@  ══════════ THE VEILBORN ══════════',
      '',
      ...log.map(l => `  ${l.text}`),
      voidLine,
      '',
      `\`!  Veilborn HP: \`@${vb.currentHp.toLocaleString()}\`!/\`@${THE_VEILBORN.hp.toLocaleString()}`,
      `\`!  Your HP:     \`${hpCol}${newHp.toLocaleString()}\`!/\`%${player.hit_max.toLocaleString()}`,
      '',
      '`$  [F]`% Strike with the Seal!',
      '`7  [R]`% Flee (lose 50% gold)',
    ].filter(l => l !== ''),
    choices: [
      { key: 'F', label: 'Strike with the Seal!', action: 'veilborn_final_continue' },
      { key: 'R', label: 'Flee',                  action: 'veilborn_final_run' },
    ],
    pendingMessages: [],
  });
}

async function veilborn_final_run({ player, req, res, pendingMessages }) {
  req.session.veilbornCombat = null;
  const goldLost = Math.floor(Number(player.gold) * 0.5);
  await updatePlayer(player.id, { gold: Number(player.gold) - goldLost });
  player = await getPlayer(player.id);
  await addNews(`\`7${player.handle}\`% fled from the Veilborn. The rift remains open.`);
  return res.json({ ...getTownScreen(player), pendingMessages: [
    '`7You run. The Veilborn does not pursue.',
    `\`@You dropped ${goldLost.toLocaleString()} gold in your panic.`,
    '`8The Seal grows cold. The quest remains — but for another day.',
  ]});
}

module.exports = {
  veilborn_scholar,
  veilborn_scholar_accept,
  veilborn_ironhold,
  veilborn_ironhold_accept,
  veilborn_stormwatch,
  veilborn_stormwatch_accept,
  veilborn_graveport,
  veilborn_graveport_fight,
  veilborn_ashenfall,
  veilborn_ashenfall_accept,
  veilborn_final,
  veilborn_final_flee,
  veilborn_final_fight,
  veilborn_final_continue: veilborn_final_fight,
  veilborn_final_run,
};
