require('dotenv').config({ path: '.env' });
const http = require('http');
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { WebSocketServer } = require('ws');
const path = require('path');
const { initDb, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((_req, res, next) => { res.removeHeader('Permissions-Policy'); next(); });

app.use(session({
  store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'sot-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax',
  },
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/admin', require('./routes/admin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Broadcast a message to all connected WebSocket clients
function broadcast(type, data) {
  const msg = JSON.stringify({ type, data });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  ws.on('error', (err) => console.error('WebSocket error:', err));
  // No client→server messages handled yet
});

module.exports = { broadcast };

initDb().then(() => {
  server.listen(PORT, () => console.log(`Scales of Tears running at http://localhost:${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
