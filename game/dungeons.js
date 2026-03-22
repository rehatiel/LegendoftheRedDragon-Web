// Dungeon definitions — multi-room sequential runs
// Dungeon state tracked in req.session.dungeon = { id, room, totalRooms, rewardsAccrued }
// Combat rooms reuse forest_attack/run/power handlers via req.session.combat
// Event rooms use dungeon_event action

const DUNGEONS = {

  // ── Old Karth Mines ─────────────────────────────────────────────────────────
  // Carved deep into a hill overlooking a forgotten battlefield.
  // The miners broke through into something that was already there.
  old_karth_mines: {
    id: 'old_karth_mines',
    name: 'The Old Karth Mines',
    town: 'old_karth',
    description: 'Carved into the hillside generations ago. The miners found more than ore.',
    clearTitle: 'Mine Delver',
    rooms: [
      // Room 1 — Combat: entrance guardian
      {
        type: 'combat',
        intro: [
          'The mine entrance is cold stone and older darkness.',
          'Lanterns long dead line the walls. Then you hear the dragging sound.',
        ],
        monster: {
          name: 'Mine Ghoul', weapon: 'iron pickaxe',
          strMult: 1.4, hpMult: 1.3, goldMult: 1.2, expMult: 1.3,
          behavior: 'aggressive',
          meet:  'A ghoul wearing a miner\'s helmet lurches from the dark, pickaxe raised!',
          death: 'The mine ghoul crashes into a wall and goes still. The pickaxe clatters to the floor.',
        },
      },
      // Room 2 — Event: mine collapse
      {
        type: 'event',
        intro: [
          'The tunnel narrows. Timbers creak overhead.',
          'Your torch illuminates a cave-in blocking the way — but there\'s a gap.',
          'Bones and old equipment lie scattered on this side of the collapse.',
        ],
        choices: [
          { key: 'P', label: 'Push through the gap', param: 'push' },
          { key: 'S', label: 'Search the debris first', param: 'search' },
          { key: 'B', label: 'Brace the timbers, then pass', param: 'brace' },
        ],
        outcomes: {
          push: {
            goldMult: 0, expMult: 60,
            msg: [
              'You squeeze through the gap.',
              'The timbers groan. A rock clips your shoulder.',
              'You tumble out the other side, bruised but through.',
            ],
            hp: -15,
          },
          search: {
            goldMult: 300, expMult: 40,
            msg: [
              'You sift through the old equipment methodically.',
              'A miner\'s strongbox — locked, but not sturdily — yields a cache of forgotten coin.',
              'Then you squeeze through the gap.',
            ],
          },
          brace: {
            expMult: 80,
            msg: [
              'You wedge a timber prop against the creaking support.',
              'Sweat. Dust. Then: a held breath as the groaning stops.',
              'You pass through safely. Wiser, if not richer.',
            ],
          },
        },
      },
      // Room 3 — Combat: twin guardians
      {
        type: 'combat',
        intro: [
          'The shaft opens into a worked chamber — clearly older than the mine itself.',
          'Two stone sentinels stand at the far wall. Their eyes glow dull red.',
          'They were waiting.',
        ],
        monster: {
          name: 'Ancient Construct', weapon: 'seismic fist',
          strMult: 1.6, hpMult: 2.0, goldMult: 1.5, expMult: 1.6,
          behavior: 'defensive',
          meet:  'The construct heaves forward, fists cracking with contained force!',
          death: 'The ancient construct buckles and grinds to a halt. The red light fades.',
        },
      },
      // Room 4 — Boss: The Buried King
      {
        type: 'boss',
        intro: [
          '`@The deepest chamber. The air tastes of centuries.',
          'On a throne of rock sits a figure in corroded plate — still upright. Still waiting.',
          '`@Its eyes open. Hollow flame burns where the pupils should be.',
          '"You... wake me. You will regret this."',
        ],
        monster: {
          name: 'The Buried King', weapon: 'grave crown',
          strMult: 2.2, hpMult: 2.8, goldMult: 4.0, expMult: 4.0,
          behavior: 'aggressive',
          meet:  'The Buried King rises from his throne and the mountain groans around you!',
          death: 'The Buried King crumbles. His crown hits the floor and the flame goes out. Silence.',
        },
        isBoss: true,
      },
    ],
    // Reward on full clear
    reward: {
      goldMult: 500,   // × player.level
      expMult:  600,   // × player.level
      namedItemChance: 0.50,
      title: 'Mine Delver',
      msgs: [
        '`$The Old Karth Mines fall silent around you.',
        '`$You have cleared every room. The mountain yields.',
        '`$You feel richer. You feel older.',
      ],
    },
  },

  // ── Mirefen Caverns ──────────────────────────────────────────────────────────
  // Natural cave system beneath the bog. Something has made it a home.
  mirefen_caverns: {
    id: 'mirefen_caverns',
    name: 'The Mirefen Caverns',
    town: 'mirefen',
    description: 'A cave network that descends below the water table. Something old lives here.',
    clearTitle: 'Bog Delver',
    rooms: [
      // Room 1 — Combat: cavern guardian
      {
        type: 'combat',
        intro: [
          'The cave mouth exhales warm, rotten air.',
          'Something has carved runes into the entrance stone. You don\'t recognise them.',
          'You hear movement in the dark.',
        ],
        monster: {
          name: 'Cavern Serpent', weapon: 'poisoned fang',
          strMult: 1.3, hpMult: 1.4, goldMult: 1.0, expMult: 1.3,
          behavior: 'venomous',
          meet:  'A serpent the width of a barrel drops from the ceiling!',
          death: 'The cavern serpent crashes to the floor, long body convulsing.',
        },
      },
      // Room 2 — Event: glowing pool
      {
        type: 'event',
        intro: [
          'A pool of luminescent water sits in the centre of a wide chamber.',
          'Strange moss grows in rings around it. The light is calming.',
          'Bog runes are carved into the stones. They look… helpful. Mostly.',
        ],
        choices: [
          { key: 'D', label: 'Drink carefully', param: 'drink' },
          { key: 'B', label: 'Bathe your wounds', param: 'bathe' },
          { key: 'T', label: 'Take a sample (pocket it)', param: 'take' },
          { key: 'L', label: 'Leave it alone', param: 'leave' },
        ],
        outcomes: {
          drink: {
            hpPct: 0.40,
            expMult: 50,
            msg: [
              'The water tastes of iron and cold stone.',
              'It heals you. Completely, in certain places. You feel steadied.',
            ],
          },
          bathe: {
            hpPct: 0.60,
            msg: [
              'You lower your worst wounds into the pool.',
              'The light seeps into the injuries. Something knits. Something holds.',
              'Not completely healed, but meaningfully better.',
            ],
          },
          take: {
            goldMult: 250,
            msg: [
              'You fill a flask from the pool.',
              'Outside, it will just look like muddy water.',
              'You sell it to an alchemist in the next town for a creditable price.',
            ],
          },
          leave: {
            expMult: 20,
            msg: [
              'You study it. You do not touch it.',
              'Wisdom is sometimes its own reward.',
            ],
          },
        },
      },
      // Room 3 — Combat: coven encounter
      {
        type: 'combat',
        intro: [
          'Three women in the robes of the old faith stand in a ring.',
          'They are chanting. They stop when they hear you.',
          '`@All three turn at once.',
        ],
        monster: {
          name: 'Swamp Witch', weapon: 'coven hex',
          strMult: 1.5, hpMult: 1.6, goldMult: 2.0, expMult: 1.8,
          behavior: 'aggressive',
          meet:  'The eldest of the three steps forward. Her eyes are gone. She doesn\'t need them.',
          death: 'The coven breaks. The other two scatter into the dark.',
        },
      },
      // Room 4 — Boss: The Swamp Mother
      {
        type: 'boss',
        intro: [
          '`@The final chamber is vast. The ceiling is lost in darkness.',
          'The floor is a shallow lake of black water.',
          '`@Something beneath the surface becomes aware of you.',
          '`@The water rises. The Swamp Mother wakes.',
        ],
        monster: {
          name: 'The Swamp Mother', weapon: 'crushing coil',
          strMult: 2.0, hpMult: 3.2, goldMult: 4.5, expMult: 4.5,
          behavior: 'defensive',
          meet:  'The Swamp Mother rises — vast, ancient, and deeply unimpressed by your presence!',
          death: 'The Swamp Mother sinks back into the black water. The lake grows still. The bog is yours.',
        },
        isBoss: true,
      },
    ],
    reward: {
      goldMult: 500,
      expMult:  600,
      namedItemChance: 0.50,
      title: 'Bog Delver',
      msgs: [
        '`$The Mirefen Caverns fall quiet around you.',
        '`$The swamp recognises you, now. Or perhaps it fears you.',
        '`$Either way — you\'re richer. And wiser.',
      ],
    },
  },
};

function getDungeon(dungeonId) {
  return DUNGEONS[dungeonId] || null;
}

module.exports = { DUNGEONS, getDungeon };
