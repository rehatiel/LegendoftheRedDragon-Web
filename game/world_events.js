// World events — server-wide rotating modifiers, one active at a time
// Each event lasts EVENT_DURATION_DAYS, then a new one is picked automatically in newday

const EVENT_DURATION_DAYS = 3;

const WORLD_EVENTS = {

  plague: {
    id:       'plague',
    name:     'The Rotting Fever',
    tagline:  'A plague spreads through the frontier settlements.',
    newsIntro: '`@THE ROTTING FEVER spreads across the land! Healers are overwhelmed. The sick crowd every inn.',
    newsExpiry: '`7The Rotting Fever has finally broken. The frontier breathes again.',
    effects: {
      innHealMult:     0.50,   // inn heals for half the normal amount
      forestGoldMult:  0.80,   // people hoarding coin
      forestExpMult:   1.00,
      shopPriceMult:   1.00,
      combatNote: '`@The plague weakens all who fight. Inn healing is halved.',
    },
  },

  war: {
    id:       'war',
    name:     'The Border Wars',
    tagline:  'Open conflict erupts in the Eastern Reaches. Everyone suffers.',
    newsIntro: '`@WAR erupts across the frontier! Armed bands roam the roads. The price of steel soars.',
    newsExpiry: '`7An uneasy truce has been reached. The Border Wars are over — for now.',
    effects: {
      innHealMult:     1.00,
      forestGoldMult:  1.30,   // war profiteering
      forestExpMult:   1.20,   // desperate fights
      shopPriceMult:   1.25,   // weapons/armour up
      combatNote: '`$War has made every fight more desperate. Gold and experience increased.',
    },
  },

  dragon_stirs: {
    id:       'dragon_stirs',
    name:     'The Red Dragon Stirs',
    tagline:  'The ancient beast has been sighted abroad. Fear grips the towns.',
    newsIntro: '`@THE RED DRAGON has been spotted circling the frontier! Brave souls sharpen their steel.',
    newsExpiry: '`7The dragon has retreated to its lair. The skies are clear... for now.',
    effects: {
      innHealMult:     1.00,
      forestGoldMult:  1.00,
      forestExpMult:   1.50,   // fear sharpens skills
      shopPriceMult:   1.00,
      combatNote: '`@The dragon\'s shadow sharpens every warrior\'s edge. +50% experience from all fights.',
    },
  },

  arcane_storm: {
    id:       'arcane_storm',
    name:     'The Arcane Tempest',
    tagline:  'Wild magic tears through the sky. Nothing is predictable.',
    newsIntro: '`!AN ARCANE STORM has erupted! Wild magic surges across the frontier. Expect the unexpected.',
    newsExpiry: '`!The Arcane Tempest dissipates. The air smells of ozone and possibility.',
    effects: {
      innHealMult:     1.00,
      forestGoldMult:  1.20,
      forestExpMult:   1.30,
      shopPriceMult:   0.90,   // chaos creates bargains
      combatNote: '`!Wild magic surges through every fight. Gold and experience increased. Shops selling cheaper.',
    },
  },

  grand_fair: {
    id:       'grand_fair',
    name:     "The Merchant's Grand Fair",
    tagline:  'A season of trade and plenty. The markets overflow.',
    newsIntro: "`$THE GRAND FAIR arrives! Merchants flood the towns with wares. Gold flows freely.",
    newsExpiry: '`$The Grand Fair has ended. The merchants pack their stalls and move on.',
    effects: {
      innHealMult:     1.20,   // better care available
      forestGoldMult:  1.50,   // more buyers = better prices
      forestExpMult:   1.00,
      shopPriceMult:   0.85,   // sale
      combatNote: null,
    },
  },

  undead_rising: {
    id:       'undead_rising',
    name:     'The Midnight Awakening',
    tagline:  'The dead walk. Every grave is a threat.',
    newsIntro: '`8THE DEAD WALK! A tide of undead rises across the land. Their graves overflow with old wealth.',
    newsExpiry: '`8The undead have crumbled to dust. The graves are quiet once more.',
    effects: {
      innHealMult:     0.80,
      forestGoldMult:  1.40,   // undead carry old hoards
      forestExpMult:   1.30,
      shopPriceMult:   1.10,
      combatNote: '`8The undead hunger. Slaying them yields greater gold and experience.',
    },
  },

};

const EVENT_IDS = Object.keys(WORLD_EVENTS);

function getEventDef(type) {
  return WORLD_EVENTS[type] || null;
}

function pickNextEvent(currentType = null) {
  const pool = currentType ? EVENT_IDS.filter(id => id !== currentType) : EVENT_IDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { WORLD_EVENTS, EVENT_IDS, EVENT_DURATION_DAYS, getEventDef, pickNextEvent };
