// Deed-based title system — earned through in-game actions, displayed next to player name.
// One active title at a time; players choose which to show from their earned set.

const DEED_TITLES = [
  {
    id:      'dragonslayer',
    display: 'the Dragonslayer',
    desc:    'Slain the Red Dragon.',
    npcTag:  'dragonslayer',  // used by NPC reaction checks
  },
  {
    id:      'widowmaker',
    display: 'the Widowmaker',
    desc:    '10 or more PvP kills.',
    npcTag:  'widowmaker',
  },
  {
    id:      'undying',
    display: 'the Undying',
    desc:    'Returned from death 3 or more times.',
    npcTag:  'undying',
  },
  {
    id:      'shadow',
    display: 'the Shadow',
    desc:    'Fled from combat 20 or more times.',
    npcTag:  'shadow',
  },
  {
    id:      'wardens_champion',
    display: "the Warden's Champion",
    desc:    'Sealed the Veilborn and redeemed the Dragon\'s sacrifice.',
    npcTag:  'wardens_champion',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasTitle(player, titleId) {
  try {
    const titles = typeof player.earned_titles === 'string'
      ? JSON.parse(player.earned_titles)
      : (player.earned_titles || []);
    return Array.isArray(titles) && titles.includes(titleId);
  } catch { return false; }
}

function getEarnedTitles(player) {
  try {
    const t = typeof player.earned_titles === 'string'
      ? JSON.parse(player.earned_titles)
      : (player.earned_titles || []);
    return Array.isArray(t) ? t : [];
  } catch { return []; }
}

/**
 * Returns an `updates` object to pass to updatePlayer(), or null if the
 * player already has this title (no-op).
 * Auto-sets active_title if none is chosen yet.
 */
function buildTitleAward(player, titleId) {
  if (hasTitle(player, titleId)) return null;
  const titles = getEarnedTitles(player);
  titles.push(titleId);
  const updates = { earned_titles: JSON.stringify(titles) };
  if (!player.active_title) updates.active_title = titleId;
  return updates;
}

/**
 * Returns the display string for the player's currently active deed title,
 * e.g. "the Dragonslayer", or '' if none.
 */
function getActiveTitleDisplay(player) {
  if (!player.active_title) return '';
  const t = DEED_TITLES.find(d => d.id === player.active_title);
  return t ? t.display : '';
}

module.exports = { DEED_TITLES, hasTitle, getEarnedTitles, buildTitleAward, getActiveTitleDisplay };
