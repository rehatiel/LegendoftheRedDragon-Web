// World events handler — town invader fight
const { getPlayer, updatePlayer, getInvadingEnemies, updateNamedEnemy, addNews, getActiveWorldEvent } = require('../../db');
const { getMonster } = require('../data');
const { getTownScreen, getForestEncounterScreen } = require('../engine');
const { getEventDef } = require('../world_events');
const { TOWNS } = require('../data');

async function town_invader_fight({ player, req, res, pendingMessages }) {
  if (player.dead)
    return res.json({ ...getTownScreen(player), pendingMessages: ['`@You are dead! Come back tomorrow.'] });

  const townId = player.current_town || 'dawnmark';
  const invaders = await getInvadingEnemies(townId);

  if (!invaders.length)
    return res.json({ ...getTownScreen(player), pendingMessages: ['`7The threat has already passed.'] });

  const enemy = invaders[0];
  const base  = getMonster(enemy.level, enemy.template_index);
  const displayName = `${enemy.given_name}${enemy.title ? ', ' + enemy.title : ''}`;

  const monster = {
    ...base,
    name:        displayName,
    displayName,
    artName:     base.name,
    strength:    enemy.strength,
    hp:          enemy.hp,
    maxHp:       enemy.hp,
    currentHp:   enemy.hp,
    gold:        enemy.gold,
    exp:         enemy.exp,
    isNamed:     true,
    namedEnemyId: enemy.id,
    meet: `\`@${displayName}\`% stands at the town gate, blocking your path!`,
    death: `${displayName} falls. The town gate opens.`,
  };

  req.session.combat       = { monster, round: 1, history: [] };
  req.session.forestDepth  = 0;
  req.session.townInvaderFight = { namedEnemyId: enemy.id, townId };

  const townName = TOWNS[townId]?.name || townId;
  return res.json({
    ...getForestEncounterScreen(player, monster),
    pendingMessages: [
      ...pendingMessages,
      `\`@You charge toward the gate of ${townName}!`,
    ],
  });
}

module.exports = { town_invader_fight };
