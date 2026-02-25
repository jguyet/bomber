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
 *   WL[w|h|data]              - World data (cells: "id,ground;...")
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

// ─── Configuration ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 8060;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 22;
const TILE_SIZE = 32;
const PLAYER_SPEED = 1.5;
const BOMB_RANGE = 4;
const BOMB_TIMER_MS = 3000;
const CHAIN_EXPLOSION_DELAY_MS = 350; // delay between chained bomb explosions (ms)
const ITEM_DROP_CHANCE = 0.35; // 35% chance to drop an item when a soft wall is destroyed
const ITEM_TYPES = ['fire', 'bomb', 'boots']; // equal probability
const SPEED_BOOST = 0.3; // speed increase per boots pickup
// Player hitbox: (x, y) is the top-left corner of the hitbox.
// The hitbox must be smaller than TILE_SIZE to fit through 1-tile corridors.
const PLAYER_W = 14;  // hitbox width  (half-size, centered in 32px tile → 9px padding each side)
const PLAYER_H = 14;  // hitbox height
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

// Active items: Map<itemId, Item>
let nextItemId = 0;
const items = new Map();

// ─── Item (Power-up) ────────────────────────────────────────────────────────
class Item {
  constructor(id, type, cellX, cellY) {
    this.id = id;
    this.type = type; // 'fire', 'bomb', or 'boots'
    this.cellX = cellX;
    this.cellY = cellY;
    this.pickedUp = false;
  }
}

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

// Wrap pixel coordinates into the canonical map space (handles dup navigation)
const MAP_WIDTH_PX  = MAP_WIDTH  * TILE_SIZE; // 1280
const MAP_HEIGHT_PX = MAP_HEIGHT * TILE_SIZE; // 704
function wrapCoord(px, py) {
  // Double-modulo pattern: JS % returns negative for negative inputs
  // (e.g. -1.5 % 1280 === -1.5), so we add the size then mod again to
  // guarantee a positive result in [0, size).
  return {
    wx: ((px % MAP_WIDTH_PX)  + MAP_WIDTH_PX)  % MAP_WIDTH_PX,
    wy: ((py % MAP_HEIGHT_PX) + MAP_HEIGHT_PX) % MAP_HEIGHT_PX
  };
}

// Convert pixel coordinates to cell (matching Java: getCellPos)
// Wraps coordinates so players on visually-duplicated tiles still collide correctly
function getCellPos(px, py) {
  const { wx, wy } = wrapCoord(px, py);
  const gx = Math.floor(wx / TILE_SIZE);
  const gy = Math.floor(wy / TILE_SIZE);
  return getCellByGridPos(gx, gy);
}

// Wrap grid coordinate into [0, size) range
function wrapGrid(v, size) {
  return ((v % size) + size) % size;
}

// Get cells in a direction, wrapping around map edges
function getDirCells(cell, dir, range) {
  const result = [];
  if ((dir & DIR.up) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x, wrapGrid(cell.y - i, MAP_HEIGHT));
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.right) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(wrapGrid(cell.x + i, MAP_WIDTH), cell.y);
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.down) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x, wrapGrid(cell.y + i, MAP_HEIGHT));
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.left) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(wrapGrid(cell.x - i, MAP_WIDTH), cell.y);
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
    this.nickname = 'Player';  // default nickname, overridden by NI message
    this.dir = 0;       // bitmask of active directions
    this.olddir = 1;    // last visual direction (0=up,1=right,2=down,3=left)
    this.onmove = false;
    // Per-player stats (affected by item pickups)
    this.bombRange = BOMB_RANGE;   // increased by 'fire' item
    this.maxBombs = 1;             // increased by 'bomb' item
    this.activeBombs = 0;          // current bombs placed
    this.speed = PLAYER_SPEED;     // increased by 'boots' item
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
    return getCellPos(this.x + PLAYER_W / 2, this.y + PLAYER_H / 2);
  }

  // Check if both corner points of a hitbox edge are in walkable cells
  _canMove(x1, y1, x2, y2) {
    const c1 = getCellPos(x1, y1);
    const c2 = getCellPos(x2, y2);
    if (!c1 || !c1.isWalkableCheckBomb(this)) return false;
    if (!c2 || !c2.isWalkableCheckBomb(this)) return false;
    return true;
  }

  move(io) {
    if (!this.onmove) return;
    const speed = this.speed;

    if ((this.dir & DIR.up) !== 0) {
      const edgeY = this.y - speed;
      if (!this._canMove(this.x + 1, edgeY, this.x + PLAYER_W - 1, edgeY)) {
        this._forceKeyUp('KU38', io);
        this._forceKeyUp('KU87', io);
      } else {
        this.y -= speed;
      }
    }
    if ((this.dir & DIR.down) !== 0) {
      const edgeY = this.y + PLAYER_H + speed;
      if (!this._canMove(this.x + 1, edgeY, this.x + PLAYER_W - 1, edgeY)) {
        this._forceKeyUp('KU40', io);
        this._forceKeyUp('KU83', io);
      } else {
        this.y += speed;
      }
    }
    if ((this.dir & DIR.left) !== 0) {
      const edgeX = this.x - speed;
      if (!this._canMove(edgeX, this.y + 1, edgeX, this.y + PLAYER_H - 1)) {
        this._forceKeyUp('KU37', io);
        this._forceKeyUp('KU65', io);
      } else {
        this.x -= speed;
      }
    }
    if ((this.dir & DIR.right) !== 0) {
      const edgeX = this.x + PLAYER_W + speed;
      if (!this._canMove(edgeX, this.y + 1, edgeX, this.y + PLAYER_H - 1)) {
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
    this.x = spawnCell.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
    this.y = spawnCell.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;
    this.olddir = 0;
    // Reset stats to defaults on death
    this.bombRange = BOMB_RANGE;
    this.maxBombs = 1;
    this.activeBombs = 0;
    this.speed = PLAYER_SPEED;
    // Broadcast new position — PS (stopped) since player is teleported, not moving
    broadcast(io, `PS${this.id}|${Math.round(this.x)}|${Math.round(this.y)}|${this.getClientDirection()}|${this.skin}|0|${this.nickname}`);
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
    this.range = launcher.bombRange || BOMB_RANGE;
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
        // Chain reaction — deferred so players have a dodge window between explosions
        const chainBomb = cell.bomb;
        setTimeout(() => {
          if (!chainBomb.haveExploded) chainBomb.explode(io);
        }, CHAIN_EXPLOSION_DELAY_MS);
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
        // Damage soft block (80 → 81) and make walkable
        cell.setGround(81);
        cell.setWalkable(true);
        cell.sendCell(io);
        // Roll for item drop
        if (Math.random() < ITEM_DROP_CHANCE) {
          const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
          const item = new Item(nextItemId++, type, cell.x, cell.y);
          items.set(item.id, item);
          io.emit('msg', 'IA' + item.id + '|' + item.type + '|' + item.cellX + '|' + item.cellY);
        }
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

    // Decrement launcher's active bomb count (if launcher still connected)
    if (players.has(this.launcher.socketId)) {
      this.launcher.activeBombs = Math.max(0, this.launcher.activeBombs - 1);
    }
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
  sendTo(socket, `PA${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|1|${player.nickname}`);

  // Tell new player about all existing players
  for (const [sid, p] of players) {
    if (sid === socket.id) continue;
    sendTo(socket, `PA${p.id}|${p.x}|${p.y}|${p.getClientDirection()}|${p.skin}|0|${p.nickname}`);
  }

  // Tell existing players about new player
  for (const [sid, p] of players) {
    if (sid === socket.id) continue;
    const otherSocket = io.sockets.sockets.get(sid);
    if (otherSocket) {
      sendTo(otherSocket, `PA${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|0|${player.nickname}`);
    }
  }

  // Send all active items to the new player
  for (const [, item] of items) {
    if (!item.pickedUp) {
      sendTo(socket, 'IA' + item.id + '|' + item.type + '|' + item.cellX + '|' + item.cellY);
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
  if (key === 38 || key === 87) d = DIR.up;
  if (key === 40 || key === 83) d = DIR.down;
  if (key === 37 || key === 65) d = DIR.left;
  if (key === 39 || key === 68) d = DIR.right;

  if (d === null) return;
  if ((d & player.dir) !== 0) return; // already active

  player.setDirection(player.dir | d); // bitwise OR — safe for multi-direction bitmask
  player.onmove = true;
  // Movement is driven by the shared serverTick loop; no per-player interval needed

  broadcast(io, `PM${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|${player.dir}|${player.nickname}`);
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
    player.setDirection(player.dir & ~d); // bitwise AND NOT — safe bitmask removal
  }
  if (player.dir === 0) {
    player.onmove = false;
    // Shared tick loop drives movement; no per-player interval to stop
  }

  broadcast(io, `PS${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|${player.dir}|${player.nickname}`);
}

function handleNickname(message, player) {
  // message = "NI<nickname>|<skinId>"
  const data = message.substring(2);
  const sep = data.indexOf('|');
  if (sep === -1) {
    player.nickname = data.trim().substring(0, 20) || 'Player';
    return;
  }
  const nick = data.substring(0, sep).trim().substring(0, 20) || 'Player';
  const skinRaw = parseInt(data.substring(sep + 1), 10);
  player.nickname = nick;
  player.skin = (skinRaw >= 0 && skinRaw <= 23) ? skinRaw : 1;
}

function handleChat(message, player, io) {
  // message = "MN<text>" => broadcast prefixed with sender nickname
  const text = message.substring(2);
  broadcast(io, `MN${player.nickname}: ${text}`);
}

function addBomb(player, io) {
  const cell = player.getCurCell();
  if (!cell) return;
  if (cell.hasBomb()) return;
  // Check bomb count limit
  if (player.activeBombs >= player.maxBombs) return;

  const bombId = nextBombId++;
  const bx = cell.x * TILE_SIZE;
  const by = cell.y * TILE_SIZE;
  const bomb = new Bomb(bombId, bx, by, player, 1);
  player.activeBombs++;
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
      // Broadcast authoritative position every tick while moving
      broadcast(io, `PM${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|${player.dir}|${player.nickname}`);
    }
    // Check item pickup for all players (moving or not — they may be standing on an item)
    const playerCell = player.getCurCell();
    if (playerCell) {
      for (const [itemId, item] of items) {
        if (item.pickedUp) continue;
        if (playerCell.x === item.cellX && playerCell.y === item.cellY) {
          item.pickedUp = true;
          items.delete(itemId);
          // Apply power-up
          if (item.type === 'fire') player.bombRange += 1;
          else if (item.type === 'bomb') player.maxBombs += 1;
          else if (item.type === 'boots') player.speed += SPEED_BOOST;
          // Broadcast pickup
          io.emit('msg', 'IP' + itemId + '|' + player.id);
        }
      }
    }
  }
}

// Start the shared game tick loop
setInterval(() => serverTick(io), TICK_MS);

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // Spawn player at a valid start cell
  const spawnCell = getRandomWalkableCellStart();
  const px = spawnCell.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
  const py = spawnCell.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;

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

      case 'N':
        if (action === 'I') {
          handleNickname(message, player);
        }
        break;

      case 'M':
        if (action === 'N') {
          handleChat(message, player, io);
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
    player.onmove = false; // stop movement in shared tick loop
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
