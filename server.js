/**
 * Bomber - Node.js Game Server (Express + Socket.io unified on port 8060)
 *
 * Protocol: all messages use 2-char prefix [TYPE][ACTION] + data
 *
 * Incoming from client:
 *   WL         - Request world data
 *   KD[key]    - Key down (38/87=up, 40/83=down, 37/65=left, 39/68=right, 32=bomb)
 *   KU[key]    - Key up
 *   MN[msg]    - Chat message
 *
 * Outgoing to client:
 *   WL[w|h|data]              - World data (cells: "id,ground;...")
 *   WC[ground|x|y|walkable]  - Cell updated
 *   PA[id|x|y|dir|skin|bcurrent] - Player added (bcurrent=1 = "this is you")
 *   PD[id]                   - Player disconnected
 *   PM[id|x|y|dir|skin|bytedir]  - Player moving
 *   PS[id|x|y|dir|skin|bytedir]  - Player stopped
 *   BA[id|x|y|range]         - Bomb added
 *   BE[id|sup|down|left|right]   - Bomb exploded
 *   MN[msg]                  - Chat message broadcast
 *   GK                       - Game kick (disconnect)
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// ─── Configuration ──────────────────────────────────────────────────────────
const PORT = 8060;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 22;
const TILE_SIZE = 32;
const PLAYER_SPEED = 1.5;
const BOMB_RANGE = 4;
const BOMB_TIMER_MS = 3000;
// Direction bitmasks (same as Java BinaryDirection enum)
const DIR = {
  up:    4,
  right: 8,
  down:  16,
  left:  32
};

// ─── Utility ────────────────────────────────────────────────────────────────
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Game State ─────────────────────────────────────────────────────────────
let nextPlayerId = 0;
let nextBombId = 0;

// Map: array of Case objects
const cases = [];

// Active players: Map<socketId, Player>
const players = new Map();

// Active bombs: Map<bombId, Bomb>
const bombs = new Map();

// ─── Case (Map Cell) ────────────────────────────────────────────────────────
class Case {
  constructor(id, walkable, ground, x, y) {
    this.id = id;
    this.walkable = walkable;
    this.ground = ground;
    this.x = x;   // grid position (0-based)
    this.y = y;   // grid position (0-based)
    this.bomb = null;
  }

  isWalkable() {
    return this.walkable;
  }

  // Walkable check that also considers bomb occupancy
  isWalkableCheckBomb(player) {
    if (this.bomb !== null) {
      if (this.bomb.launcher.id === player.id) {
        // launcher can leave the cell they placed the bomb on
        if (player.getCurCell() !== null && player.getCurCell().id !== this.id) {
          return false;
        }
        return true;
      }
      return false;
    }
    return this.walkable;
  }

  hasBomb() {
    return this.bomb !== null;
  }

  setBomb(b) {
    this.bomb = b;
  }

  setWalkable(v) {
    this.walkable = v;
  }

  setGround(g) {
    this.ground = g;
  }

  sendCell(io) {
    io.emit('msg', `WC${this.ground}|${this.x}|${this.y}|${this.walkable ? '1' : '0'}`);
  }
}

// ─── Map Initialization ─────────────────────────────────────────────────────
function initializeMap() {
  cases.length = 0;
  let i = 0;
  for (let cy = 0; cy < MAP_HEIGHT; cy++) {
    for (let cx = 0; cx < MAP_WIDTH; cx++) {
      let ground = 0;
      let walkable = true;
      if (randomInt(1, 2) === 1) {
        ground = 104;
        walkable = false;
      } else if (randomInt(1, 4) === 1) {
        ground = 80;
        walkable = false;
      }
      cases.push(new Case(i, walkable, ground, cx, cy));
      i++;
    }
  }
}

function getMapData() {
  return cases.map(c => `${c.id},${c.ground}`).join(';');
}

// ─── Map Lookups ─────────────────────────────────────────────────────────────
function getCellByGridPos(x, y) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null;
  return cases[y * MAP_WIDTH + x] || null;
}

// Convert pixel coordinates to cell (matching Java: getCellPos)
function getCellPos(px, py) {
  const gx = Math.floor(px / TILE_SIZE);
  const gy = Math.floor(py / TILE_SIZE);
  return getCellByGridPos(gx, gy); // getCellByGridPos already clamps/returns null if out of bounds
}

// Get cells in a direction (matching Java: getdircell)
function getDirCells(cell, dir, range) {
  const result = [];
  if ((dir & DIR.up) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x, cell.y - i);
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.right) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x + i, cell.y);
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.down) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x, cell.y + i);
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.left) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x - i, cell.y);
      if (c) result.push(c);
    }
  }
  return result;
}

// Count leading walkable cells in list (stops at first non-walkable)
function countLeadingWalkable(cellList) {
  let count = 0;
  for (const cell of cellList) {
    if (cell.isWalkable()) count++;
    else break;
  }
  return count;
}

// Check if cell has 3+ clear adjacent spaces (for spawning)
function have3PlacesCell(cell) {
  if (!cell.isWalkable()) return false;
  let nbr = 0;
  nbr += countLeadingWalkable(getDirCells(cell, DIR.right, 3));
  nbr += countLeadingWalkable(getDirCells(cell, DIR.left, 3));
  nbr += countLeadingWalkable(getDirCells(cell, DIR.down, 3));
  nbr += countLeadingWalkable(getDirCells(cell, DIR.up, 3));
  return nbr > 3;
}

function getRandomWalkableCellStart() {
  const eligible = cases.filter(c => have3PlacesCell(c));
  if (eligible.length === 0) {
    // Fallback: any walkable cell
    const walkable = cases.filter(c => c.isWalkable());
    if (walkable.length === 0) return cases[0];
    return walkable[randomInt(0, walkable.length - 1)];
  }
  return eligible[randomInt(0, eligible.length - 1)];
}

// ─── Player ─────────────────────────────────────────────────────────────────
class Player {
  constructor(id, x, y, skin, socketId) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.skin = skin;
    this.socketId = socketId;
    this.dir = 0;       // bitmask of active directions
    this.olddir = 1;    // last visual direction (0=up,1=right,2=down,3=left)
    this.onmove = false;
  }

  getClientDirection() {
    if (this.dir === 0) return this.olddir;
    if ((this.dir & DIR.up) !== 0)    return 0;
    if ((this.dir & DIR.right) !== 0) return 1;
    if ((this.dir & DIR.down) !== 0)  return 2;
    if ((this.dir & DIR.left) !== 0)  return 3;
    return this.olddir;
  }

  setDirection(d) {
    this.dir = d;
    if (d !== 0) this.olddir = this.getClientDirection();
  }

  getCurCell() {
    return getCellPos(this.x + 10, this.y + 10);
  }

  getPossibleCell(dx, dy) {
    if ((this.y + 12 + dy) < 0) return null;
    if ((this.x + 13.5 + dx) < 0) return null;
    return getCellPos(this.x + 10 + dx, this.y + 10 + dy);
  }

  move(io) {
    if (!this.onmove) return;
    const speed = PLAYER_SPEED;

    if ((this.dir & DIR.up) !== 0) {
      const c = this.getPossibleCell(0, -speed);
      if (c === null || !c.isWalkableCheckBomb(this)) {
        this._forceKeyUp('KU38', io);
        this._forceKeyUp('KU87', io);
      } else {
        this.y -= speed;
      }
    }
    if ((this.dir & DIR.down) !== 0) {
      const c = this.getPossibleCell(0, speed + 2);
      if (c === null || !c.isWalkableCheckBomb(this)) {
        this._forceKeyUp('KU40', io);
        this._forceKeyUp('KU83', io);
      } else {
        this.y += speed;
      }
    }
    if ((this.dir & DIR.left) !== 0) {
      const c = this.getPossibleCell(-speed, 0);
      if (c === null || !c.isWalkableCheckBomb(this)) {
        this._forceKeyUp('KU37', io);
        this._forceKeyUp('KU65', io);
      } else {
        this.x -= speed;
      }
    }
    if ((this.dir & DIR.right) !== 0) {
      const c = this.getPossibleCell(speed + 12, 0);
      if (c === null || !c.isWalkableCheckBomb(this)) {
        this._forceKeyUp('KU39', io);
        this._forceKeyUp('KU68', io);
      } else {
        this.x += speed;
      }
    }
  }

  _forceKeyUp(msg, io) {
    handleKeyUp(msg, this, io);
  }

  die(io) {
    const spawnCell = getRandomWalkableCellStart();
    this.x = (spawnCell.x * TILE_SIZE) - 5;
    this.y = (spawnCell.y * TILE_SIZE) + 10;
    this.olddir = 0;
    // Broadcast new position
    broadcast(io, `PM${this.id}|${this.x}|${this.y}|${this.getClientDirection()}|${this.skin}|${this.dir}`);
  }
}

// ─── Bomb ────────────────────────────────────────────────────────────────────
class Bomb {
  constructor(id, x, y, launcher, skin) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.launcher = launcher;
    this.skin = skin;
    this.range = BOMB_RANGE;
    this.haveExploded = false;
    this.curcell = launcher.getCurCell();
    this.timer = null;
  }

  start(io) {
    if (this.curcell) {
      this.curcell.setBomb(this);
    }
    this.timer = setTimeout(() => this.explode(io), BOMB_TIMER_MS);
  }

  explodeLine(cellList, io) {
    let count = 0;
    for (const cell of cellList) {
      // Check if any player is in this cell
      let playerDied = false;
      for (const [, player] of players) {
        const pcell = player.getCurCell();
        if (pcell && pcell.id === cell.id) {
          player.die(io);
          playerDied = true;
          break;
        }
      }
      if (playerDied) break;

      if (cell.hasBomb()) {
        // Chain reaction
        cell.bomb.explode(io);
        count++;
        break;
      } else if (!cell.isWalkable() && cell.ground === 104) {
        // Destroy solid block
        cell.setWalkable(true);
        cell.setGround(0);
        cell.sendCell(io);
        count++;
        break;
      } else if (!cell.isWalkable() && cell.ground === 80) {
        // Damage soft block (80 → 81)
        cell.setGround(81);
        cell.sendCell(io);
        break;
      } else if (!cell.isWalkable()) {
        break;
      }
      count++;
    }
    return count;
  }

  explode(io) {
    if (this.haveExploded) return;
    this.haveExploded = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const cell = this.curcell;
    const cellsUp    = getDirCells(cell, DIR.up,    this.range);
    const cellsDown  = getDirCells(cell, DIR.down,  this.range);
    const cellsLeft  = getDirCells(cell, DIR.left,  this.range);
    const cellsRight = getDirCells(cell, DIR.right, this.range);

    const sup   = this.explodeLine(cellsUp,    io);
    const sdown = this.explodeLine(cellsDown,  io);
    const sleft = this.explodeLine(cellsLeft,  io);
    const sright= this.explodeLine(cellsRight, io);

    broadcast(io, `BE${this.id}|${sup}|${sdown}|${sleft}|${sright}`);

    // Remove bomb from cell and from global list
    if (cell) cell.setBomb(null);
    bombs.delete(this.id);
  }
}

// ─── Broadcast helpers ───────────────────────────────────────────────────────
function broadcast(io, message) {
  io.emit('msg', message);
}

function sendTo(socket, message) {
  socket.emit('msg', message);
}

// ─── Message Handlers ────────────────────────────────────────────────────────

function handleWorldLoad(socket, io) {
  const player = players.get(socket.id);
  if (!player) return;

  // Send world data
  sendTo(socket, `WL${MAP_WIDTH}|${MAP_HEIGHT}|${getMapData()}`);

  // Send current player info (bcurrent=1 means "this is you")
  sendTo(socket, `PA${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|1`);

  // Tell new player about all existing players
  for (const [sid, p] of players) {
    if (sid === socket.id) continue;
    sendTo(socket, `PA${p.id}|${p.x}|${p.y}|${p.getClientDirection()}|${p.skin}|0`);
  }

  // Tell existing players about new player
  for (const [sid, p] of players) {
    if (sid === socket.id) continue;
    const otherSocket = io.sockets.sockets.get(sid);
    if (otherSocket) {
      sendTo(otherSocket, `PA${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|0`);
    }
  }
}

function handleKeyDown(message, player, socket, io) {
  const key = parseInt(message.substring(2), 10);

  // Bomb placement
  if (key === 32) {
    addBomb(player, io);
    return;
  }

  let d = null;
  const speed = PLAYER_SPEED;

  if (key === 38 || key === 87) { // up
    d = DIR.up;
    const c = player.getPossibleCell(0, -speed);
    if (c !== null && !c.isWalkableCheckBomb(player)) d = null;
  }
  if (key === 40 || key === 83) { // down
    d = DIR.down;
    const c = player.getPossibleCell(0, speed + 2);
    if (c !== null && !c.isWalkableCheckBomb(player)) d = null;
  }
  if (key === 37 || key === 65) { // left
    d = DIR.left;
    const c = player.getPossibleCell(-speed, 0);
    if (c !== null && !c.isWalkableCheckBomb(player)) d = null;
  }
  if (key === 39 || key === 68) { // right
    d = DIR.right;
    const c = player.getPossibleCell(speed + 12, 0);
    if (c !== null && !c.isWalkableCheckBomb(player)) d = null;
  }

  if (d === null) return;
  if ((d & player.dir) !== 0) return; // already moving in this direction

  player.setDirection(player.dir + d);
  player.onmove = true;

  broadcast(io, `PM${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|${player.dir}`);
}

function handleKeyUp(message, player, io) {
  const key = parseInt(message.substring(2), 10);

  let d = null;
  if (key === 38 || key === 87) d = DIR.up;
  if (key === 40 || key === 83) d = DIR.down;
  if (key === 37 || key === 65) d = DIR.left;
  if (key === 39 || key === 68) d = DIR.right;

  if (d === null) return;

  if ((d & player.dir) !== 0) {
    player.setDirection(player.dir - d);
  }
  if (player.dir < 0) player.setDirection(0);
  if (player.dir === 0) {
    player.onmove = false;
  }

  broadcast(io, `PS${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|${player.dir}`);
}

function handleChat(message, io) {
  // message = "MN<text>" => broadcast as-is
  broadcast(io, message);
}

function addBomb(player, io) {
  const cell = player.getCurCell();
  if (!cell) return;
  if (cell.hasBomb()) return;

  const bombId = nextBombId++;
  const bx = cell.x * TILE_SIZE;
  const by = cell.y * TILE_SIZE;
  const bomb = new Bomb(bombId, bx, by, player, 1);
  bomb.start(io);
  bombs.set(bombId, bomb);

  broadcast(io, `BA${bomb.id}|${bomb.x}|${bomb.y}|${bomb.range}`);
}

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();

// Serve static files (index.html, js/, css/, assets/)
app.use(express.static(path.join(__dirname)));

// API stub — future REST routes
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
console.log(`Map initialized: ${MAP_WIDTH}x${MAP_HEIGHT} tiles`);

// ─── Single shared game tick loop (~60 FPS) ───────────────────────────────────
const TICK_MS = 16;

function serverTick(io) {
  for (const [, player] of players) {
    if (player.onmove) {
      player.move(io);
    }
  }
}

setInterval(() => serverTick(io), TICK_MS);

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // Spawn player at a valid start cell
  const spawnCell = getRandomWalkableCellStart();
  const px = (spawnCell.x * TILE_SIZE) - 5;
  const py = (spawnCell.y * TILE_SIZE) + 10;

  const playerId = nextPlayerId++;
  const player = new Player(playerId, px, py, 1, socket.id);
  players.set(socket.id, player);

  // Handle incoming messages (protocol: "XX..." where XX = type+action)
  socket.on('msg', (data) => {
    const message = String(data);
    if (message.length < 2) return;

    const type   = message.charAt(0);
    const action = message.charAt(1);

    switch (type) {
      case 'W':
        if (action === 'L') {
          handleWorldLoad(socket, io);
        }
        break;

      case 'K':
        if (action === 'D') {
          handleKeyDown(message, player, socket, io);
        } else if (action === 'U') {
          handleKeyUp(message, player, io);
        }
        break;

      case 'M':
        if (action === 'N') {
          handleChat(message, io);
        }
        break;

      default:
        // unknown message type — ignore
        break;
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    players.delete(socket.id);

    // Notify other players
    broadcast(io, `PD${player.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Bomber unified server running on port ${PORT}`);
  console.log(`  Static files: http://localhost:${PORT}/`);
  console.log(`  Socket.io:    ws://localhost:${PORT}/ws`);
  console.log(`  API ping:     http://localhost:${PORT}/api/ping`);
});
