const express = require('express');
const { pool, getAllPlayers, getRecentNews, addNews, updatePlayer, TODAY } = require('../db');
const { runNewDay } = require('../game/newday');

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lordadmin';

// Auth middleware — checks Authorization: Bearer <password>
router.use((req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

const ar = fn => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/admin/players — list all players
router.get('/players', ar(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, handle, level, class, exp, gold, dead, setup_complete, last_seen, created_at FROM players ORDER BY level DESC, exp DESC'
  );
  res.json(rows);
}));

// GET /api/admin/news — recent news
router.get('/news', ar(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM news ORDER BY id DESC LIMIT 50');
  res.json(rows);
}));

// GET /api/admin/migrations — applied migrations
router.get('/migrations', ar(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM schema_migrations ORDER BY id ASC');
  res.json(rows);
}));

// POST /api/admin/reset-player — reset a player's dead/near_death flag
router.post('/reset-player', ar(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  await updatePlayer(id, { dead: 0, near_death: 0, near_death_by: '', hit_points: 15 });
  res.json({ ok: true });
}));

// POST /api/admin/new-day — trigger new day for all active players
router.post('/new-day', ar(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM players WHERE setup_complete = 1');
  let count = 0;
  for (const player of rows) {
    const { updates } = await runNewDay(player);
    await updatePlayer(player.id, { ...updates, last_day: TODAY() });
    count++;
  }
  await addNews('`$[ADMIN] A new day has been triggered manually.');
  res.json({ ok: true, playersUpdated: count });
}));

// POST /api/admin/announce — post a system news message
router.post('/announce', ar(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  await addNews(`\`$[SYSTEM] ${message.substring(0, 80)}`);
  res.json({ ok: true });
}));

module.exports = router;
