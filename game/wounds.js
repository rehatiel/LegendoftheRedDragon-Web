// Wound & infection system for SoT

// Derive monster family from name keywords
function getMonsterFamily(monster) {
  const n = monster.name.toLowerCase();
  if (/zombie|skeleton|ghoul|vampire|lich|wraith|shade|revenant|death knight/.test(n)) return 'undead';
  if (/rat|dog|wolf|boar|harpy|wererat|werewolf|bat|spider|hound|panther|bear/.test(n)) return 'beast';
  if (/giant|troll|ogre|cyclops|golem|titan/.test(n)) return 'giant';
  if (/slime|ooze|elemental|imp|demon|sprite|fairy|phantom|specter/.test(n)) return 'magical';
  return 'humanoid';
}

// Derive wound type from monster family
function getWoundType(monster) {
  const family = getMonsterFamily(monster);
  const n = monster.name.toLowerCase();
  if (family === 'undead') return 'bite';
  if (family === 'beast') return /rat|dog|wolf|bat|were/.test(n) ? 'bite' : 'slash';
  if (family === 'giant') return 'crush';
  if (family === 'magical') return 'bite';
  return 'slash';
}

// Severity 1-3 based on monster strength vs player
function getWoundSeverity(monster, player) {
  const ratio = monster.strength / Math.max(1, player.strength);
  if (ratio >= 2.0) return 3;
  if (ratio >= 0.8) return 2;
  return 1;
}

// Probability that a hit causes a wound
function woundChance(severity, isCrit) {
  if (isCrit) return 0.60;
  return severity === 3 ? 0.35 : severity === 2 ? 0.20 : 0.10;
}

// Parse wounds JSON array from player record
function parseWounds(player) {
  try { return JSON.parse(player.wounds || '[]'); } catch { return []; }
}

// Bleed HP per round for slash wounds
function getBleedDamage(wound, hitMax) {
  const pct = wound.severity === 3 ? 0.06 : wound.severity === 2 ? 0.03 : 0.01;
  return Math.max(1, Math.floor(hitMax * pct));
}

// Effective defense percentage penalty from crush wounds (0.0–0.60)
function getCrushDefPenalty(wounds) {
  let pct = 0;
  for (const w of wounds) {
    if (w.type === 'crush') pct += w.severity === 3 ? 0.30 : w.severity === 2 ? 0.15 : 0.05;
  }
  return Math.min(0.60, pct);
}

function hasSerious(wounds) { return wounds.some(w => w.severity >= 2); }
function hasCritical(wounds) { return wounds.some(w => w.severity >= 3); }

// Returns { infectionType, message } or null based on monster family/name
function rollInfection(monster) {
  const family = getMonsterFamily(monster);
  const n = monster.name.toLowerCase();

  if (family === 'undead') {
    if (/vampire/.test(n)) {
      return { infectionType: 'vampire_bite', message: `\`#The vampire's fangs leave two dark marks on your neck. You feel strangely cold.` };
    }
    if (/zombie|ghoul/.test(n) && Math.random() < 0.30) {
      return { infectionType: 'rot', message: `\`8The wound from the ${monster.name} smells wrong. Something may be festering.` };
    }
  }

  if (family === 'beast' && /rabid|wererat|werewolf/.test(n) && Math.random() < 0.25) {
    return { infectionType: 'rabies', message: `\`2The bite feels feverish. A chill runs down your spine.` };
  }

  return null;
}

// Resolve infection priority when a new infection is introduced:
// vampire transform > vampire_bite > everything else; zombie ignores rabies
function resolveInfection(currentType, newType) {
  if (!newType) return currentType;
  if (currentType === 'vampire' || currentType === 'zombie') return currentType;
  if (newType === 'vampire_bite') return newType;
  if (currentType === 'vampire_bite') return currentType;
  if (currentType === 'zombie' && newType === 'rabies') return currentType;
  return newType;
}

// Gold cost for healer to treat all wounds
function healerWoundCost(wounds, playerLevel) {
  return wounds.reduce((sum, w) => sum + w.severity * playerLevel * 30, 0);
}

// Gold cost for healer to treat infection (scales with stage)
function healerInfectionCost(infectionType, infectionStage, playerLevel) {
  const base = { rot: 80, rabies: 120, vampire_bite: 200 }[infectionType] || 100;
  return Math.floor(base * playerLevel * (1 + infectionStage * 0.5));
}

// Human-readable wound description
function woundLabel(wound) {
  const sev = wound.severity === 3 ? 'Critical' : wound.severity === 2 ? 'Serious' : 'Minor';
  const type = wound.type === 'slash' ? 'Slash' : wound.type === 'crush' ? 'Crush' : 'Bite';
  return `${sev} ${type} (from ${wound.source})`;
}

// Human-readable infection description
function infectionLabel(infectionType, infectionStage) {
  const labels = {
    rot:          ['Festering Rot (early)', 'Festering Rot (spreading)', 'Festering Rot (critical)'],
    rabies:       ['Rabies (early)', 'Rabies (advanced)', 'Rabies (terminal)'],
    vampire_bite: ['Vampire Bite (fresh)', 'Vampire Bite (progressing)', 'Vampire Bite (imminent)'],
    zombie:       ['Zombie Plague (early)', 'Zombie Plague (spreading)', 'Zombie Plague (advanced)'],
    vampire:      ['Vampire (transformed)', 'Vampire (transformed)', 'Vampire (transformed)'],
  };
  return (labels[infectionType] || [])[Math.min(2, infectionStage)] || infectionType;
}

module.exports = {
  getMonsterFamily,
  getWoundType,
  getWoundSeverity,
  woundChance,
  parseWounds,
  getBleedDamage,
  getCrushDefPenalty,
  hasSerious,
  hasCritical,
  rollInfection,
  resolveInfection,
  healerWoundCost,
  healerInfectionCost,
  woundLabel,
  infectionLabel,
};
