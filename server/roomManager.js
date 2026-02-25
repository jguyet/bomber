const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────
const MAP_WIDTH = 80;
const MAP_HEIGHT = 42;
const TILE_SIZE = 32;
const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const BOMB_TIMER_MS = 3000;
const DEFAULT_SPEED = 1.5;
const DEFAULT_RANGE = 2;
const DEFAULT_MAX_BOMBS = 1;
const ROUND_DURATION_MS = 180000; // 3 minutes
const ROUND_END_DISPLAY_MS = 5000; // 5 seconds results screen
const MIN_PLAYERS_TO_START = 2;

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickRandomTheme() {
  const themes = ['default', 'winter', 'moon'];
  return themes[Math.floor(Math.random() * themes.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Room Class ──────────────────────────────────────────────────────────────
class Room {
  constructor(id, name, maxPlayers, themeId, creatorId, io) {
    this.id = id;
    this.name = name;
    this.maxPlayers = maxPlayers; // 2-8
    this.themeId = themeId; // 'default' | 'winter' | 'moon' | 'random'
    this.activeTheme = themeId === 'random' ? pickRandomTheme() : themeId;
    this.creatorId = creatorId;
    this.state = 'waiting'; // 'waiting' | 'playing'
    this.createdAt = Date.now();
    this.io = io; // Socket.io server instance for room-scoped broadcasting

    // Isolated game state
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
      x,
      y,
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
    this.cells.length = 0;
    let id = 0;
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        let groundId = 0;
        let walkable = true;

        if (getRandomInt(1, 3) === 1) {
          groundId = 104; // destructible wall
          walkable = false;
        } else if (getRandomInt(1, 5) === 1) {
          groundId = 80; // indestructible wall
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

  // ─── Broadcast helpers (Socket.io room-scoped) ───────────────────────────

  broadcast(message, excludeSocketId) {
    if (this.io) {
      if (excludeSocketId) {
        this.io.to('room:' + this.id).except(excludeSocketId).emit('game', message);
      } else {
        this.io.to('room:' + this.id).emit('game', message);
      }
    }
  }

  broadcastAll(message) {
    if (this.io) {
      this.io.to('room:' + this.id).emit('game', message);
    }
  }

  sendTo(socket, message) {
    if (socket && socket.connected) {
      socket.emit('game', message);
    }
  }

  sendCellUpdate(cell) {
    this.broadcastAll('WC' + cell.groundId + '|' + cell.x + '|' + cell.y);
  }

  // ─── Player methods ──────────────────────────────────────────────────────

  createPlayer(socket) {
    const spawnCell = this.getRandomWalkableCellStart();
    const id = this.nextPlayerId++;
    const p = {
      id,
      x: (spawnCell.x * TILE_SIZE) - 5,
      y: (spawnCell.y * TILE_SIZE) + 10,
      skin: getRandomInt(0, 23),
      dir: 0,
      olddir: 2,
      onmove: false,
      speed: DEFAULT_SPEED,
      range: DEFAULT_RANGE,
      maxBombs: DEFAULT_MAX_BOMBS,
      bombCounter: 0,
      nickname: 'Player' + id,
      skinId: 0,
      alive: true,
      kills: 0,
      deaths: 0,
      socket,
    };
    return p;
  }

  getClientDirection(player) {
    if (player.dir === 0) return player.olddir;
    if (player.dir & DIR.UP)    return 0;
    if (player.dir & DIR.RIGHT) return 1;
    if (player.dir & DIR.DOWN)  return 2;
    if (player.dir & DIR.LEFT)  return 3;
    return player.olddir;
  }

  getPlayerCurCell(player) {
    return this.getCellAtPixel(player.x + 10, player.y + 10);
  }

  getPlayerPossibleCell(player, dx, dy) {
    return this.getCellAtPixel(player.x + 10 + dx, player.y + 10 + dy);
  }

  isWalkableCheckBomb(cell, player) {
    if (!cell) return false;
    const curCell = this.getPlayerCurCell(player);
    if (cell.bomb) {
      if (cell.bomb.launcherId !== player.id) return false;
      if (!curCell || curCell.id !== cell.id) return false;
      return true;
    }
    return cell.walkable;
  }

  findPlayerById(id) {
    for (const [, p] of this.players) {
      if (p.id === id) return p;
    }
    return null;
  }

  // ─── Bomb System ─────────────────────────────────────────────────────────

  addBomb(player) {
    const cell = this.getPlayerCurCell(player);
    if (!cell) return;
    if (cell.bomb) return;
    if (player.bombCounter >= player.maxBombs) return;

    player.bombCounter++;

    const bomb = {
      id: this.nextBombId++,
      x: cell.x * TILE_SIZE,
      y: cell.y * TILE_SIZE,
      launcherId: player.id,
      cell,
      range: player.range,
      hasExploded: false,
      timer: null,
    };

    cell.bomb = bomb;
    this.bombs.push(bomb);

    this.broadcastAll('BA' + bomb.id + '|' + bomb.x + '|' + bomb.y + '|' + bomb.range);

    bomb.timer = setTimeout(() => this.explodeBomb(bomb), BOMB_TIMER_MS);
  }

  explodeLine(cellList, bomb) {
    let count = 0;
    const brokenWalls = [];
    const chainBombs = [];

    for (const cell of cellList) {
      // check if player is on this cell => kill them
      for (const [, p] of this.players) {
        if (!p.alive) continue;
        const pCell = this.getPlayerCurCell(p);
        if (pCell && pCell.id === cell.id) {
          this.killPlayer(p, bomb);
        }
      }

      // Destroy items on explosion-affected cells
      if (cell.item) {
        this.despawnItem(cell.item);
      }

      if (cell.bomb) {
        chainBombs.push(cell.bomb);
        break;
      } else if (!cell.walkable && cell.groundId === 104) {
        // destructible wall
        cell.walkable = true;
        cell.groundId = 0;
        this.sendCellUpdate(cell);
        brokenWalls.push(cell);
        count++;
        break;
      } else if (!cell.walkable && cell.groundId === 80) {
        // cracked wall
        cell.groundId = 81;
        this.sendCellUpdate(cell);
        break;
      } else if (!cell.walkable) {
        break;
      }
      count++;
    }
    return { count, brokenWalls, chainBombs };
  }

  explodeBomb(bomb) {
    if (bomb.hasExploded) {
      bomb.cell.bomb = null;
      this.removeBomb(bomb);
      return;
    }
    bomb.cell.bomb = null;
    this.removeBomb(bomb);
    if (bomb.timer) clearTimeout(bomb.timer);
    bomb.timer = null;
    bomb.hasExploded = true;

    // restore bomb counter for launcher
    const launcher = this.findPlayerById(bomb.launcherId);
    if (launcher) {
      launcher.bombCounter = Math.max(0, launcher.bombCounter - 1);
    }

    const cell = bomb.cell;
    const sup   = this.explodeLine(this.getDirCells(cell, DIR.UP, bomb.range), bomb);
    const down  = this.explodeLine(this.getDirCells(cell, DIR.DOWN, bomb.range), bomb);
    const left  = this.explodeLine(this.getDirCells(cell, DIR.LEFT, bomb.range), bomb);
    const right = this.explodeLine(this.getDirCells(cell, DIR.RIGHT, bomb.range), bomb);

    // check center cell for player kills
    for (const [, p] of this.players) {
      if (!p.alive) continue;
      const pCell = this.getPlayerCurCell(p);
      if (pCell && pCell.id === cell.id) {
        this.killPlayer(p, bomb);
      }
    }

    // Destroy item on center cell
    if (cell.item) {
      this.despawnItem(cell.item);
    }

    this.broadcastAll('BE' + bomb.id + '|' + sup.count + '|' + down.count + '|' + left.count + '|' + right.count);

    // chain explosions
    const allChainBombs = [
      ...sup.chainBombs,
      ...down.chainBombs,
      ...left.chainBombs,
      ...right.chainBombs,
    ];
    for (const b of allChainBombs) {
      setTimeout(() => this.explodeBomb(b), 1);
    }

    // spawn items from broken walls
    const allBrokenWalls = [
      ...sup.brokenWalls,
      ...down.brokenWalls,
      ...left.brokenWalls,
      ...right.brokenWalls,
    ];
    for (const wallCell of allBrokenWalls) {
      this.trySpawnItem(wallCell);
    }
  }

  removeBomb(bomb) {
    const idx = this.bombs.indexOf(bomb);
    if (idx !== -1) this.bombs.splice(idx, 1);
  }

  // ─── Item System ─────────────────────────────────────────────────────────

  trySpawnItem(cell) {
    if (cell.bomb) return;

    let templateId = -1;
    if (getRandomInt(1, 10) > 8) templateId = 0; // extra bomb
    if (getRandomInt(1, 10) > 8) templateId = 4; // range up
    if (getRandomInt(1, 10) > 8) templateId = 6; // speed up
    if (templateId === -1) return;

    const item = {
      id: this.nextItemId++,
      templateId,
      x: cell.x * TILE_SIZE,
      y: cell.y * TILE_SIZE,
      cell,
      timer: null,
    };
    cell.item = item;
    this.items.push(item);

    this.broadcastAll('IA' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);

    // Items persist until collected or destroyed by explosion (no auto-despawn)
    item.timer = null;
  }

  despawnItem(item) {
    if (item.cell) item.cell.item = null;
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    this.broadcastAll('ID' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);
  }

  pickupItem(player, item) {
    if (item.timer) clearTimeout(item.timer);
    if (item.cell) item.cell.item = null;
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);

    // Apply effect
    if (item.templateId === 0) {
      player.maxBombs++;
    }
    if (item.templateId === 4) {
      player.range++;
    }
    if (item.templateId === 6) {
      player.speed += 0.1;
      this.broadcastAll('IS' + player.id + '|' + player.speed);
    }

    this.broadcastAll('ID' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);
  }

  // ─── Kill / Scoreboard ───────────────────────────────────────────────────

  killPlayer(player, bomb) {
    if (!player.alive) return;

    player.alive = false;
    player.deaths++;
    player.dir = 0;
    player.onmove = false;

    // Find killer via bomb launcher
    let killer = null;
    if (bomb) {
      killer = this.findPlayerById(bomb.launcherId);
    }

    // Increment killer's kills (unless self-kill)
    if (killer && killer.id !== player.id) {
      killer.kills++;
    }

    // Broadcast kill feed: KF{killerId}|{killerNick}|{victimId}|{victimNick}
    const killerId = killer ? killer.id : '';
    const killerNick = killer ? killer.nickname : '';
    this.broadcastAll('KF' + killerId + '|' + killerNick + '|' + player.id + '|' + player.nickname);

    // Broadcast player death: PK{id}
    this.broadcastAll('PK' + player.id);

    // Broadcast updated scoreboard
    this.broadcastScoreboard();

    // Check if round should end
    this.checkRoundEnd();
  }

  broadcastScoreboard() {
    const entries = [];
    for (const [, p] of this.players) {
      entries.push(p.id + '|' + p.nickname + '|' + p.kills + '|' + p.deaths);
    }
    this.broadcastAll('SB' + entries.join(';'));
  }

  // ─── Round State Machine ─────────────────────────────────────────────────

  startRound() {
    this.roundState.state = 'active';
    this.roundState.startTime = Date.now();
    this.roundState.roundNumber++;

    // Reset all player stats and respawn
    for (const [, p] of this.players) {
      p.kills = 0;
      p.deaths = 0;
      p.alive = true;
      p.speed = DEFAULT_SPEED;
      p.range = DEFAULT_RANGE;
      p.maxBombs = DEFAULT_MAX_BOMBS;
      p.bombCounter = 0;

      // Respawn player to a new position
      const spawnCell = this.getRandomWalkableCellStart();
      if (spawnCell) {
        p.x = (spawnCell.x * TILE_SIZE) - 5;
        p.y = (spawnCell.y * TILE_SIZE) + 10;
        p.dir = 0;
        p.olddir = 2;
        p.onmove = false;
      }

      // Broadcast updated position
      this.broadcastAll('PM' + p.id
        + '|' + p.x
        + '|' + p.y
        + '|' + this.getClientDirection(p)
        + '|' + p.skin
        + '|' + p.dir
        + '|' + p.onmove
        + '|' + p.nickname);
    }

    // Broadcast round state
    this.broadcastAll('RS' + 'active' + '|' + ROUND_DURATION_MS);

    // Start countdown timer — end round when time runs out
    if (this.roundState.timer) clearTimeout(this.roundState.timer);
    this.roundState.timer = setTimeout(() => {
      if (this.roundState.state === 'active') {
        let winner = null;
        let bestKills = -1;
        for (const [, p] of this.players) {
          if (p.alive && (p.kills > bestKills || (p.kills === bestKills && winner === null))) {
            bestKills = p.kills;
            winner = p;
          }
        }
        this.endRound(winner ? winner.id : null, winner ? winner.nickname : null);
      }
    }, ROUND_DURATION_MS);

    // Start broadcasting time remaining every second
    if (this.roundState.timeInterval) clearInterval(this.roundState.timeInterval);
    this.roundState.timeInterval = setInterval(() => {
      if (this.roundState.state === 'active') {
        this.broadcastRoundState();
      } else {
        clearInterval(this.roundState.timeInterval);
        this.roundState.timeInterval = null;
      }
    }, 1000);
  }

  endRound(winnerId, winnerNickname) {
    this.roundState.state = 'ended';

    // Clear round timer
    if (this.roundState.timer) {
      clearTimeout(this.roundState.timer);
      this.roundState.timer = null;
    }

    // Clear time broadcast interval
    if (this.roundState.timeInterval) {
      clearInterval(this.roundState.timeInterval);
      this.roundState.timeInterval = null;
    }

    // Broadcast winner
    this.broadcastAll('RW' + (winnerId || '') + '|' + (winnerNickname || ''));

    // Build and broadcast full results
    const playerResults = [];
    for (const [, p] of this.players) {
      playerResults.push(p.id + '|' + p.nickname + '|' + (p.kills || 0) + '|' + (p.deaths || 0));
    }
    const resultsStr = 'RE' + (winnerId || '') + '|' + (winnerNickname || '') + '|' + playerResults.join(';');
    this.roundState.lastResults = resultsStr;
    this.broadcastAll(resultsStr);

    // Broadcast ended state
    this.broadcastAll('RS' + 'ended' + '|0');

    // After display time, reset the round
    setTimeout(() => {
      this.resetRound();
    }, ROUND_END_DISPLAY_MS);
  }

  resetRound() {
    // Clear all bombs and their timers
    for (const b of this.bombs) {
      if (b.timer) clearTimeout(b.timer);
      if (b.cell) b.cell.bomb = null;
    }
    this.bombs.length = 0;

    // Clear all items and their timers
    for (const item of this.items) {
      if (item.timer) clearTimeout(item.timer);
      if (item.cell) item.cell.item = null;
    }
    this.items.length = 0;

    // Regenerate map
    this.cells.length = 0;
    this.initializeMap();

    // Reset all players for new round
    for (const [, player] of this.players) {
      player.alive = true;
      player.kills = 0;
      player.deaths = 0;
      player.speed = DEFAULT_SPEED;
      player.range = DEFAULT_RANGE;
      player.maxBombs = DEFAULT_MAX_BOMBS;
      player.bombCounter = 0;
      player.dir = 0;
      player.olddir = 2;
      player.onmove = false;
      const spawnCell = this.getRandomWalkableCellStart();
      if (spawnCell) {
        player.x = (spawnCell.x * TILE_SIZE) - 5;
        player.y = (spawnCell.y * TILE_SIZE) + 10;
      }
    }

    // Broadcast round reset then new map data
    this.broadcastAll('RR');
    this.broadcastAll('WL' + MAP_WIDTH + '|' + MAP_HEIGHT + '|' + this.getMapData());

    // Send entity data (PA messages) for all players to each client
    for (const [socketId, player] of this.players) {
      // Send self
      this.sendTo(player.socket, 'PA' + player.id
        + '|' + player.x
        + '|' + player.y
        + '|' + this.getClientDirection(player)
        + '|' + player.skin
        + '|' + player.speed
        + '|1'
        + '|' + player.nickname);

      // Send other players
      for (const [otherSocketId, otherPlayer] of this.players) {
        if (otherSocketId === socketId) continue;
        this.sendTo(player.socket, 'PA' + otherPlayer.id
          + '|' + otherPlayer.x
          + '|' + otherPlayer.y
          + '|' + this.getClientDirection(otherPlayer)
          + '|' + otherPlayer.skin
          + '|' + otherPlayer.speed
          + '|0'
          + '|' + otherPlayer.nickname);
      }
    }

    // Set state to waiting
    this.roundState.state = 'waiting';

    // Check if enough players to auto-start (with delay to allow clients to load)
    if (this.players.size >= MIN_PLAYERS_TO_START) {
      setTimeout(() => {
        if (this.roundState.state === 'waiting' && this.players.size >= MIN_PLAYERS_TO_START) {
          this.startRound();
        }
      }, 2000);
    }
  }

  checkRoundEnd() {
    if (this.roundState.state !== 'active') return;

    let aliveCount = 0;
    let lastAlive = null;
    for (const [, p] of this.players) {
      if (p.alive) {
        aliveCount++;
        lastAlive = p;
      }
    }

    if (aliveCount <= 1) {
      this.endRound(
        lastAlive ? lastAlive.id : null,
        lastAlive ? lastAlive.nickname : null
      );
    }
  }

  broadcastRoundState() {
    const timeRemaining = this.roundState.state === 'active'
      ? Math.max(0, ROUND_DURATION_MS - (Date.now() - this.roundState.startTime))
      : 0;
    this.broadcastAll('RS' + this.roundState.state + '|' + timeRemaining);
  }

  // ─── Movement ────────────────────────────────────────────────────────────

  movePlayer(player) {
    if (!player.alive) return;
    if (!player.onmove) return;

    const speed = player.speed;

    if (player.dir & DIR.UP) {
      const c = this.getPlayerPossibleCell(player, 0, -speed);
      if (!c || !this.isWalkableCheckBomb(c, player)) {
        this.forceKeyUp(player, DIR.UP);
      } else {
        player.y -= speed;
      }
    }
    if (player.dir & DIR.DOWN) {
      const c = this.getPlayerPossibleCell(player, 0, speed + 2);
      if (!c || !this.isWalkableCheckBomb(c, player)) {
        this.forceKeyUp(player, DIR.DOWN);
      } else {
        player.y += speed;
      }
    }
    if (player.dir & DIR.LEFT) {
      const c = this.getPlayerPossibleCell(player, -speed, 0);
      if (!c || !this.isWalkableCheckBomb(c, player)) {
        this.forceKeyUp(player, DIR.LEFT);
      } else {
        player.x -= speed;
      }
    }
    if (player.dir & DIR.RIGHT) {
      const c = this.getPlayerPossibleCell(player, speed + 12, 0);
      if (!c || !this.isWalkableCheckBomb(c, player)) {
        this.forceKeyUp(player, DIR.RIGHT);
      } else {
        player.x += speed;
      }
    }

    // wrap around
    if (player.x < 0) player.x = (MAP_WIDTH * TILE_SIZE) + player.x;
    if (player.y < 0) player.y = (MAP_HEIGHT * TILE_SIZE) + player.y;
    player.x = player.x % (MAP_WIDTH * TILE_SIZE);
    player.y = player.y % (MAP_HEIGHT * TILE_SIZE);

    // check item pickup
    const curCell = this.getPlayerCurCell(player);
    if (curCell && curCell.item) {
      this.pickupItem(player, curCell.item);
    }
  }

  forceKeyUp(player, binDir) {
    if (player.dir & binDir) {
      player.dir -= binDir;
    }
    if (player.dir < 0) player.dir = 0;
    if (player.dir === 0) player.onmove = false;

    this.broadcastAll('PS' + player.id
      + '|' + player.x
      + '|' + player.y
      + '|' + this.getClientDirection(player)
      + '|' + player.skin
      + '|' + player.dir
      + '|' + player.onmove
      + '|' + player.nickname);
  }

  // ─── Game Tick ───────────────────────────────────────────────────────────

  gameTick() {
    for (const [, player] of this.players) {
      this.movePlayer(player);
    }
  }

  startTick() {
    this.tickInterval = setInterval(() => this.gameTick(), TICK_MS);
  }

  stopTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // ─── Message Handlers ────────────────────────────────────────────────────

  handleKeyDown(player, message) {
    if (!player.alive) return;
    const key = parseInt(message.substring(2), 10);
    if (isNaN(key)) return;

    const speed = player.speed;

    // Space = bomb
    if (key === 32) {
      this.addBomb(player);
      return;
    }

    let d = null;
    if (key === 38 || key === 87) {
      d = DIR.UP;
      const c = this.getPlayerPossibleCell(player, 0, -speed);
      if (c && !this.isWalkableCheckBomb(c, player)) d = null;
    }
    if (key === 40 || key === 83) {
      d = DIR.DOWN;
      const c = this.getPlayerPossibleCell(player, 0, speed + 2);
      if (c && !this.isWalkableCheckBomb(c, player)) d = null;
    }
    if (key === 37 || key === 65) {
      d = DIR.LEFT;
      const c = this.getPlayerPossibleCell(player, -speed, 0);
      if (c && !this.isWalkableCheckBomb(c, player)) d = null;
    }
    if (key === 39 || key === 68) {
      d = DIR.RIGHT;
      const c = this.getPlayerPossibleCell(player, speed + 12, 0);
      if (c && !this.isWalkableCheckBomb(c, player)) d = null;
    }

    if (d === null) return;
    if ((d & player.dir) !== 0) return;

    player.dir += d;
    if (player.dir !== 0) player.olddir = this.getClientDirection(player);
    player.onmove = true;

    this.broadcastAll('PM' + player.id
      + '|' + player.x
      + '|' + player.y
      + '|' + this.getClientDirection(player)
      + '|' + player.skin
      + '|' + player.dir
      + '|' + player.onmove
      + '|' + player.nickname);
  }

  handleKeyUp(player, message) {
    const key = parseInt(message.substring(2), 10);
    if (isNaN(key)) return;

    let d = null;
    if (key === 38 || key === 87) d = DIR.UP;
    if (key === 40 || key === 83) d = DIR.DOWN;
    if (key === 37 || key === 65) d = DIR.LEFT;
    if (key === 39 || key === 68) d = DIR.RIGHT;

    if (d === null) return;
    if (player.dir & d) {
      player.dir -= d;
    }
    if (player.dir < 0) player.dir = 0;
    if (player.dir === 0) player.onmove = false;

    this.broadcastAll('PS' + player.id
      + '|' + player.x
      + '|' + player.y
      + '|' + this.getClientDirection(player)
      + '|' + player.skin
      + '|' + player.dir
      + '|' + player.onmove
      + '|' + player.nickname);
  }

  handleChatMessage(player, message) {
    const msg = message.substring(2);
    if (!msg || msg.length === 0) return;
    this.broadcastAll('MN' + player.nickname + '|' + msg);
  }

  handleWorldLoad(player, socket) {
    this.sendTo(socket, 'WL' + MAP_WIDTH + '|' + MAP_HEIGHT + '|' + this.getMapData());
  }

  handleWorldEntities(player, socket) {
    // Send self (bcurrent = 1)
    this.sendTo(socket, 'PA' + player.id
      + '|' + player.x
      + '|' + player.y
      + '|' + this.getClientDirection(player)
      + '|' + player.skin
      + '|' + player.speed
      + '|1'
      + '|' + player.nickname);

    // Send existing bombs
    for (const b of this.bombs) {
      this.sendTo(socket, 'BA' + b.id + '|' + b.x + '|' + b.y + '|' + b.range);
    }

    // Send existing items
    for (const item of this.items) {
      this.sendTo(socket, 'IA' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);
    }

    // Send other players to this client, and notify others about this player
    for (const [otherSocketId, otherPlayer] of this.players) {
      if (otherPlayer.socket === socket) continue;

      // Tell new client about existing player
      this.sendTo(socket, 'PA' + otherPlayer.id
        + '|' + otherPlayer.x
        + '|' + otherPlayer.y
        + '|' + this.getClientDirection(otherPlayer)
        + '|' + otherPlayer.skin
        + '|' + otherPlayer.speed
        + '|0'
        + '|' + otherPlayer.nickname);

      // Tell existing player about new client
      this.sendTo(otherPlayer.socket, 'PA' + player.id
        + '|' + player.x
        + '|' + player.y
        + '|' + this.getClientDirection(player)
        + '|' + player.skin
        + '|' + player.speed
        + '|0'
        + '|' + player.nickname);
    }

    // Send current round state to newly connected player
    const timeRemaining = this.roundState.state === 'active'
      ? Math.max(0, ROUND_DURATION_MS - (Date.now() - this.roundState.startTime))
      : 0;
    this.sendTo(socket, 'RS' + this.roundState.state + '|' + timeRemaining);

    // Send current scoreboard
    this.broadcastScoreboard();

    // If round is ended, send cached results screen data
    if (this.roundState.state === 'ended' && this.roundState.lastResults) {
      this.sendTo(socket, this.roundState.lastResults);
    }

    // Auto-start round if enough players and currently waiting
    if (this.roundState.state === 'waiting' && this.players.size >= MIN_PLAYERS_TO_START) {
      setTimeout(() => {
        if (this.roundState.state === 'waiting' && this.players.size >= MIN_PLAYERS_TO_START) {
          this.startRound();
        }
      }, 3000);
    }
  }

  handleNicknameInit(player, message) {
    const data = message.substring(2);
    const parts = data.split('|');
    if (parts.length >= 1) {
      let nick = parts[0].trim();
      if (nick.length > 16) nick = nick.substring(0, 16);
      if (nick.length === 0) nick = 'Player';
      player.nickname = nick;
    }
    if (parts.length >= 2) {
      const skinId = parseInt(parts[1], 10);
      if (!isNaN(skinId) && skinId >= 0 && skinId <= 23) {
        player.skin = skinId;
        player.skinId = skinId;
      }
    }
  }

  processMessage(socket, player, message) {
    if (!message || message.length < 2) return;

    const type = message.charAt(0);
    const action = message.charAt(1);

    switch (type) {
      case 'K':
        if (action === 'D') this.handleKeyDown(player, message);
        if (action === 'U') this.handleKeyUp(player, message);
        break;
      case 'M':
        if (action === 'N') this.handleChatMessage(player, message);
        break;
      case 'P':
        if (action === 'M') {
          // Client position sync — ignored on authoritative server
        }
        break;
      case 'W':
        if (action === 'L') this.handleWorldLoad(player, socket);
        if (action === 'E') this.handleWorldEntities(player, socket);
        break;
      case 'N':
        if (action === 'I') this.handleNicknameInit(player, message);
        break;
    }
  }
}

// ─── RoomManager Class ──────────────────────────────────────────────────────

class RoomManager {
  constructor(io) {
    this.rooms = new Map(); // roomId -> Room
    this.nextRoomId = 1;
    this.io = io; // Socket.io server instance
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
    const room = new Room(id, name, maxPlayers, themeId, creatorId, this.io);
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
      room.stopTick();
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
  TICK_RATE,
  TICK_MS,
  BOMB_TIMER_MS,
  DEFAULT_SPEED,
  DEFAULT_RANGE,
  DEFAULT_MAX_BOMBS,
  ROUND_DURATION_MS,
  ROUND_END_DISPLAY_MS,
  MIN_PLAYERS_TO_START,
  pickRandomTheme,
  getRandomInt
};
