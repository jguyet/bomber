/**
 * Bomber - Node.js Game Server (Express + Socket.io unified on port 8060)
 *
 * Protocol: all messages use 2-char prefix [TYPE][ACTION] + data
 *
 * Incoming from client:
 *   WL         - Request world data
 *   NI[nick|skinId] - Set nickname and skin
 *   KD[key]    - Key down (38/87=up, 40/83=down, 37/65=left, 39/68=right, 32=bomb)
 *   KU[key]    - Key up
 *   MN[msg]    - Chat message
 *
 * Outgoing to client:
 *   WL[w|h|tileset|cols|rows|data] - World data (tileset path, spritesheet cols/rows, cells: "id,ground;...")
 *   WC[ground|x|y|walkable]  - Cell updated
 *   PA[id|x|y|dir|skin|bcurrent|nickname] - Player added (bcurrent=1 = "this is you")
 *   PD[id]                   - Player disconnected
 *   PM[id|x|y|dir|skin|bytedir|nickname]  - Player moving
 *   PS[id|x|y|dir|skin|bytedir|nickname]  - Player stopped
 *   BA[id|x|y|range]         - Bomb added
 *   BE[id|sup|down|left|right]   - Bomb exploded
 *   MN[msg]                  - Chat message broadcast
 *   GK                       - Game kick (disconnect)
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { PORT, TILE_SIZE, PLAYER_W, PLAYER_H, TICK_MS } = require('./server/config');
const state = require('./server/state');
const { initializeMap } = require('./server/map');
const { getRandomWalkableCellStart } = require('./server/map');
const { handleWorldLoad, handleKeyDown, handleKeyUp, handleNickname, handleChat } = require('./server/handlers');
const { serverTick } = require('./server/tick');
const Player = require('./server/models/Player');
const { broadcast } = require('./server/messaging');
const { spawnBots } = require('./server/bot');

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.use(express.static(path.join(__dirname)));
app.get('/api/ping', (req, res) => {
  res.json({ ok: true });
});

// ─── HTTP + Socket.io Server ─────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  path: '/ws',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Initialize the map on server start
initializeMap();
console.log(`Map initialized: ${state.currentMapTemplate.name} (tileset: ${state.currentMapTemplate.tileset})`);
spawnBots(io);

// ─── Game tick loop (~60 FPS) ────────────────────────────────────────────────
setInterval(() => serverTick(io), TICK_MS);

// ─── Socket.io connections ───────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  const spawnCell = getRandomWalkableCellStart();
  const px = spawnCell.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
  const py = spawnCell.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;

  const playerId = state.nextPlayerId++;
  const player = new Player(playerId, px, py, 1, socket.id);
  state.players.set(socket.id, player);

  socket.on('msg', (data) => {
    const message = String(data);
    if (message.length < 2) return;

    const type   = message.charAt(0);
    const action = message.charAt(1);

    switch (type) {
      case 'W':
        if (action === 'L') handleWorldLoad(socket, io);
        break;
      case 'K':
        if (action === 'D') handleKeyDown(message, player, socket, io);
        else if (action === 'U') handleKeyUp(message, player, io);
        break;
      case 'N':
        if (action === 'I') handleNickname(message, player);
        break;
      case 'M':
        if (action === 'N') handleChat(message, player, io);
        break;
      default:
        break;
    }
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    player.onmove = false;
    state.players.delete(socket.id);
    broadcast(io, `PD${player.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Bomber unified server running on port ${PORT}`);
  console.log(`  Static files: http://localhost:${PORT}/`);
  console.log(`  Socket.io:    ws://localhost:${PORT}/ws`);
  console.log(`  API ping:     http://localhost:${PORT}/api/ping`);
});
