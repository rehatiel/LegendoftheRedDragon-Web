// Ruins handler — fixed locations, one-time per player per day, choice-based encounters
const { getPlayer, updatePlayer, addNews } = require('../../db');
const { RUINS } = require('../ruins');
const { checkLevelUp } = require('../newday');
const { getTownScreen, getRuinsScreen, getLevelUpScreen } = require('../engine');
const { getWeaponByNum } = require('../data');

async function ruins({ player, req, res, pendingMessages }) {
  if (player.dead)
    return res.json({ ...getTownScreen(player), pendingMessages: ['`@You are dead! Come back tomorrow.'] });

  const townId = player.current_town || 'dawnmark';
  const ruin = RUINS[townId];
  if (!ruin)
    return res.json({ ...getTownScreen(player), pendingMessages: ['`7There are no ruins to explore here.'] });

  const visited = JSON.parse(player.ruins_visited || '[]');
  if (visited.includes(ruin.id)) {
    return res.json({
      ...getTownScreen(player),
      pendingMessages: [`\`7You have already explored ${ruin.name} today. Return tomorrow.`],
    });
  }

  // Mark visited before showing screen (prevent double-dip on back navigation)
  await updatePlayer(player.id, { ruins_visited: JSON.stringify([...visited, ruin.id]) });
  player = await getPlayer(player.id);

  return res.json({ ...getRuinsScreen(player, ruin), pendingMessages });
}

async function ruins_choice({ player, param, req, res, pendingMessages }) {
  const townId = player.current_town || 'dawnmark';
  const ruin = RUINS[townId];
  if (!ruin)
    return res.json({ ...getTownScreen(player), pendingMessages });

  const outcome = ruin.outcomes[param];
  if (!outcome)
    return res.json({ ...getTownScreen(player), pendingMessages });

  const msgs = [...(outcome.msg || [])];
  const updates = {};

  if (outcome.goldFlat) {
    const delta = outcome.goldFlat < 0 ? Math.max(-Number(player.gold), outcome.goldFlat) : outcome.goldFlat;
    updates.gold = Number(player.gold) + delta;
    if (delta < 0) msgs.push(`\`@You spent ${Math.abs(delta)} gold.`);
    else if (delta > 0) msgs.push(`\`0You find ${delta.toLocaleString()} gold!`);
  }
  if (outcome.goldMult) {
    const g = outcome.goldMult * player.level;
    updates.gold = (updates.gold ?? Number(player.gold)) + g;
    msgs.push(`\`0You gain ${g.toLocaleString()} gold!`);
  }
  if (outcome.expMult) {
    const xp = outcome.expMult * player.level;
    updates.exp = Number(player.exp) + xp;
    msgs.push(`\`0You gain ${xp.toLocaleString()} experience!`);
  }
  if (outcome.hpPct) {
    const delta = Math.floor(outcome.hpPct * player.hit_max);
    const base = updates.hit_points ?? player.hit_points;
    updates.hit_points = Math.max(1, Math.min(player.hit_max, base + delta));
    if (delta < 0) msgs.push(`\`@You lost ${Math.abs(delta)} hit points!`);
    else msgs.push(`\`0You recovered ${delta} hit points!`);
  }
  if (outcome.hp) {
    const base = updates.hit_points ?? player.hit_points;
    updates.hit_points = Math.max(1, Math.min(player.hit_max, base + outcome.hp));
    if (outcome.hp < 0) msgs.push(`\`@You lost ${Math.abs(outcome.hp)} hit points!`);
    else msgs.push(`\`0You recovered ${outcome.hp} hit points!`);
  }
  if (outcome.gem) {
    updates.gems = Math.max(0, player.gems + outcome.gem);
    if (outcome.gem > 0) msgs.push(`\`0You found ${outcome.gem} gem${outcome.gem > 1 ? 's' : ''}!`);
  }
  if (outcome.charm) {
    updates.charm = player.charm + outcome.charm;
    msgs.push(outcome.charm > 0
      ? `\`#Your charm increased by ${outcome.charm}!`
      : `\`@Your charm decreased by ${Math.abs(outcome.charm)}!`);
  }
  if (outcome.strDelta) {
    updates.strength = player.strength + outcome.strDelta;
    msgs.push(outcome.strDelta > 0
      ? `\`$+${outcome.strDelta} Strength!`
      : `\`@${outcome.strDelta} Strength.`);
  }
  if (outcome.alignDelta) {
    const newAlign = Math.max(-100, Math.min(100, (player.alignment || 0) + outcome.alignDelta));
    updates.alignment = newAlign;
    msgs.push(outcome.alignDelta > 0
      ? `\`0A deed of virtue. Alignment +${outcome.alignDelta}.`
      : `\`@A dark deed. Alignment ${outcome.alignDelta}.`);
  }

  if (outcome.weaponNum) {
    const newWeapon = getWeaponByNum(outcome.weaponNum);
    if (newWeapon && !player.weapon_cursed) {
      const curWeapon = player.weapon_num > 0 ? getWeaponByNum(player.weapon_num) : null;
      if (!curWeapon || newWeapon.strength > curWeapon.strength) {
        const strDelta = newWeapon.strength - (curWeapon ? curWeapon.strength : 0);
        updates.weapon_num  = newWeapon.num;
        updates.weapon_name = newWeapon.name;
        updates.strength    = (updates.strength ?? player.strength) + strDelta;
        msgs.push(`\`$You take up the ${newWeapon.name}!`);
      } else {
        msgs.push(`\`7Your ${curWeapon.name} is already superior — you leave the sword where it stands.`);
      }
    }
  }

  if (Object.keys(updates).length) {
    await updatePlayer(player.id, updates);
    player = await getPlayer(player.id);
  }

  if (outcome.expMult) {
    const levelUp = checkLevelUp(player);
    if (levelUp) {
      await updatePlayer(player.id, levelUp.updates);
      player = await getPlayer(player.id);
      await addNews(`\`$${player.handle}\`% has advanced to level \`$${levelUp.newLevel}\`%!`);
      return res.json({
        ...getLevelUpScreen(player, levelUp.newLevel, levelUp.hpGain, levelUp.strGain, levelUp.perkPoint),
        pendingMessages: msgs,
      });
    }
  }

  return res.json({ ...getTownScreen(player), pendingMessages: msgs });
}

module.exports = { ruins, ruins_choice };
