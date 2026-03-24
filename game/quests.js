// Quest registry — metadata for display; actual logic lives in handlers
const { TOWNS } = require('./data');

const QUESTS = {
  wardens_fall: {
    name: "The Warden's Fall",
    desc: "You slew the dragon — but it was the last Warden, keeping something sealed. Now it is free.",
    steps: [
      'Return to Dawnmark. Scholar Voss has urgent news.',
      'Travel to Ironhold — the shadow armies have already reached the military front.',
      'Travel to Stormwatch — the Archivist holds records of what was sealed.',
      'Travel to Graveport — the last Warden\'s journal is aboard a ghost ship.',
      'Travel to Ashenfall — forge the Warden\'s Seal at the Ancient Forge.',
      'Return to Dawnmark — the Veilborn has arrived. Make your stand.',
    ],
  },
  widow_revenge: {
    name: "The Widow's Revenge",
    desc: 'A grieving widow begs you to avenge her husband.',
    steps: [
      'Slay a legendary named enemy in the forest.',
    ],
  },
  missing_merchant: {
    name: 'The Missing Merchant',
    desc: 'A merchant vanished on the road. Find out what happened.',
    steps: [
      'Travel to [town] and search for the missing merchant.',
      'You have found the scene. Make your choice.',
    ],
  },
  cursed_blade_bearer: {
    name: 'The Cursed Blade',
    desc: 'A dark blade has bonded to your will. Its power is real. So is its cost.',
    steps: [
      'Bear the curse — or seek a druid to cleanse it (Thornreach, 5,000 gold).',
    ],
  },
};

function getQuestName(questId) {
  return QUESTS[questId]?.name || questId.replace(/_/g, ' ');
}

function getQuestStepText(questId, step, questData) {
  const quest = QUESTS[questId];
  if (!quest?.steps) return '';
  const idx = Math.max(0, (step || 1) - 1);
  const text = quest.steps[Math.min(idx, quest.steps.length - 1)];
  if (!text) return '';
  let data = {};
  try { data = JSON.parse(questData || '{}'); } catch { /* ignore */ }
  const townName = data.targetTown ? (TOWNS[data.targetTown]?.name || data.targetTown) : '???';
  return text.replace('[town]', townName);
}

function getAlignmentLabel(score) {
  if (score >= 50)  return { text: 'Lawful Good',   color: 'dgreen' };
  if (score >= 20)  return { text: 'Good',           color: 'dgreen' };
  if (score >= -19) return { text: 'Neutral',        color: 'gray'   };
  if (score >= -49) return { text: 'Chaotic',        color: 'red'    };
  return               { text: 'Chaotic Evil',   color: 'red'    };
}

module.exports = { QUESTS, getQuestName, getQuestStepText, getAlignmentLabel };
