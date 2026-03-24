// Title selector — lets players choose which earned deed title to display.
const { getPlayer, updatePlayer } = require('../../db');
const { getTownScreen } = require('../engine');
const { DEED_TITLES, getEarnedTitles } = require('../titles');

// ── Character screen: title selector ─────────────────────────────────────────
async function character_titles({ player, req, res, pendingMessages }) {
  const earned = getEarnedTitles(player);

  if (earned.length === 0) {
    return res.json({
      screen: 'character_titles',
      title:  'Titles',
      lines: [
        '`8  ══════════════════════════════════════',
        '`$        EARNED TITLES',
        '`8  ══════════════════════════════════════',
        '',
        '`8  You have not yet earned any deed titles.',
        '',
        '`%  Titles are earned through deeds:',
        '`8  Dragonslayer — slay the Red Dragon',
        '`8  the Widowmaker — 10 PvP kills',
        '`8  the Undying — return from death 3 times',
        '`8  the Shadow — flee from combat 20 times',
        '',
        '`$  [L]`% Return',
      ],
      choices: [{ key: 'L', label: 'Return', action: 'character_records' }],
      pendingMessages: [],
    });
  }

  const lines = [
    '`8  ══════════════════════════════════════',
    '`$        EARNED TITLES',
    '`8  ══════════════════════════════════════',
    '',
    '`%  Select a title to display next to your name.',
    `\`8  Current: \`${player.active_title ? '$' : '7'}${player.active_title ? (DEED_TITLES.find(t => t.id === player.active_title)?.display || player.active_title) : '(none)'}`,
    '',
  ];

  const choices = [];
  const keys = 'ABCDEFGHIJ'.split('');

  earned.forEach((id, i) => {
    const def = DEED_TITLES.find(t => t.id === id);
    if (!def) return;
    const isActive = player.active_title === id;
    const col = isActive ? '`$' : '`%';
    lines.push(`${col}  [${keys[i]}] ${def.display}  \`8— ${def.desc}${isActive ? '  ✓ active' : ''}`);
    choices.push({ key: keys[i], label: def.display, action: 'title_set', param: id });
  });

  lines.push('');
  lines.push('`$  [N]`% No title (clear)');
  lines.push('`7  [L]`% Return');
  choices.push({ key: 'N', label: 'No title', action: 'title_set', param: '' });
  choices.push({ key: 'L', label: 'Return', action: 'character_records' });

  return res.json({ screen: 'character_titles', title: 'Titles', lines, choices, pendingMessages: [] });
}

async function title_set({ player, param, req, res, pendingMessages }) {
  const titleId = param || null;

  if (titleId && !getEarnedTitles(player).includes(titleId)) {
    return res.json({ ...getTownScreen(player), pendingMessages: ['`@You have not earned that title.'] });
  }

  await updatePlayer(player.id, { active_title: titleId || null });
  player = await getPlayer(player.id);

  const def = titleId ? DEED_TITLES.find(t => t.id === titleId) : null;
  const msg = def
    ? `\`$You are now known as ${def.display}.`
    : '`8You no longer display a title.';

  return character_titles({ player, req, res, pendingMessages: [msg] });
}

module.exports = { character_titles, title_set };
