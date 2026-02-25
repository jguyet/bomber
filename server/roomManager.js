const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────
const MAP_WIDTH = 80;
const MAP_HEIGHT = 42;
const TILE_SIZE = 32;
const DEFAULT_SPEED = 1.5;
const DEFAULT_RANGE = 2;
const DEFAULT_MAX_BOMBS = 1;

// ─── Binary Directions (bitmask) ─────────────────────────────────────────────
const DIR = { UP: 4, RIGHT: 8, DOWN: 16, LEFT: 32 };

// ─── Theme Mapping ───────────────────────────────────────────────────────────
const THEMES = {
  'default': 'assets/maps/1.png',
  'winter': 'assets/maps/1-winter.png',
  'moon': 'assets/maps/tileset-moon.png'
};

// ─── Persistence ─────────────────────────────────────────────────────────────
const DB_DIR = path.join(__dirname, '..', '.db');
const ROOMS_DB = path.join(DB_DIR, 'rooms.json');

// ─── Helper ──────────────────────────────────────────────────────────────────
function pickRandomTheme() {
  const themes = ['default', 'winter', 'moon'];
  return themes[Math.floor(Math.random() * themes.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Room Class ──────────────────────────────────────────────────────────────
class Room {
  constructor(id, name, maxPlayers, themeId, creatorId) {
    this.id = id;
    this.name = name;
    this.maxPlayers = maxPlayers; // 2-8
    this.themeId = themeId; // 'default' | 'winter' | 'moon' | 'random'
    this.activeTheme = themeId === 'random' ? pickRandomTheme() : themeId;
    this.creatorId = creatorId;
    this.state = 'waiting'; // 'waiting' | 'playing'
    this.createdAt = Date.now();

    // Isolated game state (moved from server.js globals)
    this.cells = [];
    this.players = new Map(); // socketId -> player object
    this.bombs = [];
    this.items = [];
    this.nextPlayerId = 1;
    this.nextBombId = 1;
    this.nextItemId = 1;
    this.roundState = {
      state: 'waiting',
      timer: null,
      startTime: 0,
      roundNumber: 0,
      timeInterval: null,
      lastResults: null
    };
    this.tickInterval = null;
  }

  // ─── Cell helpers ────────────────────────────────────────────────────────

  createCell(id, walkable, groundId, x, y) {
    return {
      id,
      walkable,
      groundId,
      x,          // tile x
      y,          // tile y
      bomb: null,
      item: null,
    };
  }

  getCellByTilePos(tx, ty) {
    tx = ((tx % MAP_WIDTH) + MAP_WIDTH) % MAP_WIDTH;
    ty = ((ty % MAP_HEIGHT) + MAP_HEIGHT) % MAP_HEIGHT;
    const idx = ty * MAP_WIDTH + tx;
    return this.cells[idx] || null;
  }

  getCellAtPixel(px, py) {
    const tx = Math.round(Math.round(px) / TILE_SIZE) % MAP_WIDTH;
    const ty = Math.round(Math.round(py) / TILE_SIZE) % MAP_HEIGHT;
    return this.getCellByTilePos(tx, ty);
  }

  getDirCells(cell, dir, range) {
    const result = [];
    for (let i = 1; i < range; i++) {
      let c = null;
      if (dir & DIR.UP)    c = this.getCellByTilePos(cell.x, cell.y - i);
      if (dir & DIR.RIGHT) c = this.getCellByTilePos(cell.x + i, cell.y);
      if (dir & DIR.DOWN)  c = this.getCellByTilePos(cell.x, cell.y + i);
      if (dir & DIR.LEFT)  c = this.getCellByTilePos(cell.x - i, cell.y);
      if (c) result.push(c);
    }
    return result;
  }

  countWalkable(cellList) {
    let n = 0;
    for (const c of cellList) {
      if (c.walkable) n++;
      else break;
    }
    return n;
  }

  has3PlacesAround(cell) {
    if (!cell.walkable) return false;
    let nbr = 0;
    nbr += this.countWalkable(this.getDirCells(cell, DIR.RIGHT, 3));
    nbr += this.countWalkable(this.getDirCells(cell, DIR.LEFT, 3));
    nbr += this.countWalkable(this.getDirCells(cell, DIR.DOWN, 3));
    nbr += this.countWalkable(this.getDirCells(cell, DIR.UP, 3));
    return nbr > 3;
  }

  // ─── Map initialization ──────────────────────────────────────────────────

  initializeMap() {
    this.cells.length = 0; // clear before regenerating
    let id = 0;
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        let groundId = 0;
        let walkable = true;

        if (getRandomInt(1, 3) === 1) {
          groundId = 104; // destructible wall
          walkable = false;
        } else if (getRandomInt(1, 5) === 1) {
          groundId = 80;  // indestructible wall
          walkable = false;
        }

        this.cells.push(this.createCell(id, walkable, groundId, x, y));
        id++;
      }
    }
  }

  getMapData() {
    return this.cells.map(c => c.id + ',' + c.groundId).join(';');
  }

  getRandomWalkableCell() {
    const walkable = this.cells.filter(c => c.walkable);
    if (walkable.length === 0) return null;
    return walkable[getRandomInt(0, walkable.length - 1)];
  }

  getRandomWalkableCellStart() {
    const good = this.cells.filter(c => this.has3PlacesAround(c));
    if (good.length === 0) return this.getRandomWalkableCell();
    return good[getRandomInt(0, good.length - 1)];
  }

  // ─── Broadcast helpers ───────────────────────────────────────────────────

  broadcast(message, excludeSocketId) {
    for (const [socketId, player] of this.players) {
      if (socketId !== excludeSocketId && player.socket && player.socket.connected) {
        player.socket.emit('game', message);
      }
    }
  }

  broadcastAll(message) {
    for (const [, player] of this.players) {
      if (player.socket && player.socket.connected) {
        player.socket.emit('game', message);
      }
    }
  }

  sendTo(socket, message) {
    if (socket && socket.connected) {
      socket.emit('game', message);
    }
  }
}

// ─── RoomManager Class ──────────────────────────────────────────────────────

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
    this.nextRoomId = 1;
    this._ensureDbDir();
    this._loadRooms();
  }

  _ensureDbDir() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
      console.log('Created .db/ directory for persistence');
    }
  }

  _loadRooms() {
    try {
      if (fs.existsSync(ROOMS_DB)) {
        const raw = fs.readFileSync(ROOMS_DB, 'utf8');
        if (!raw || raw.trim().length === 0) {
          console.log('rooms.json is empty, starting fresh');
          return;
        }
        const data = JSON.parse(raw);
        if (data && typeof data.nextRoomId === 'number' && data.nextRoomId > 0) {
          this.nextRoomId = data.nextRoomId;
          console.log('Restored room ID counter:', this.nextRoomId);
        }
        // Don't restore room instances — they need live socket connections
        // Just restore the ID counter so IDs don't collide
      }
    } catch (e) {
      console.log('Could not load rooms.json (' + e.message + '), starting fresh');
    }
  }

  _saveRooms() {
    try {
      this._ensureDbDir(); // ensure dir still exists before writing
      const data = {
        nextRoomId: this.nextRoomId,
        rooms: Array.from(this.rooms.values()).map(r => ({
          id: r.id,
          name: r.name,
          maxPlayers: r.maxPlayers,
          themeId: r.themeId,
          creatorId: r.creatorId,
          createdAt: r.createdAt
        }))
      };
      fs.writeFileSync(ROOMS_DB, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to persist rooms to ' + ROOMS_DB + ':', e.message);
    }
  }

  createRoom(name, maxPlayers, themeId, creatorId) {
    const id = 'room-' + this.nextRoomId++;
    const room = new Room(id, name, maxPlayers, themeId, creatorId);
    room.initializeMap();
    this.rooms.set(id, room);
    this._saveRooms();
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Clear any active timers
      if (room.tickInterval) clearInterval(room.tickInterval);
      if (room.roundState.timer) clearTimeout(room.roundState.timer);
      if (room.roundState.timeInterval) clearInterval(room.roundState.timeInterval);
      for (const b of room.bombs) {
        if (b.timer) clearTimeout(b.timer);
      }
      for (const item of room.items) {
        if (item.timer) clearTimeout(item.timer);
      }
      this.rooms.delete(roomId);
      this._saveRooms();
      return true;
    }
    return false;
  }

  listRooms() {
    return Array.from(this.rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      playerCount: r.players.size,
      maxPlayers: r.maxPlayers,
      status: r.state,
      themeId: r.themeId
    }));
  }

  getPlayerRoom(socketId) {
    for (const [, room] of this.rooms) {
      if (room.players.has(socketId)) {
        return room;
      }
    }
    return null;
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = {
  Room,
  RoomManager,
  THEMES,
  DIR,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  DEFAULT_SPEED,
  DEFAULT_RANGE,
  DEFAULT_MAX_BOMBS,
  pickRandomTheme,
  getRandomInt
};
