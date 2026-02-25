const WebSocket = require('ws');
const http = require('http');

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = 9998;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 42;
const TILE_SIZE = 32;
const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const BOMB_TIMER_MS = 3000;
const ITEM_DESPAWN_MS = 10000;
const DEFAULT_SPEED = 1.5;
const DEFAULT_RANGE = 2;
const DEFAULT_MAX_BOMBS = 1;

// ─── Round Configuration ────────────────────────────────────────────────────
const ROUND_DURATION_MS = 180000; // 3 minutes
const ROUND_END_DISPLAY_MS = 5000; // 5 seconds results screen
const MIN_PLAYERS_TO_START = 2;

// ─── Binary Directions (bitmask) ─────────────────────────────────────────────
const DIR = { UP: 4, RIGHT: 8, DOWN: 16, LEFT: 32 };

// ─── ID Generators ───────────────────────────────────────────────────────────
let nextPlayerId = 1;
let nextBombId = 1;
let nextItemId = 1;

// ─── Round State ────────────────────────────────────────────────────────────
const roundState = {
  state: 'waiting', // 'waiting' | 'active' | 'ended'
  timer: null,
  startTime: 0,
  roundNumber: 0,
  timeInterval: null, // interval for broadcasting time remaining
  lastResults: null,  // cached RE message for late joiners
};

// ─── World State ─────────────────────────────────────────────────────────────
const cells = [];       // flat array of cell objects
const players = new Map(); // ws -> player object
const bombs = [];       // active bombs
const items = [];       // active items

// ─── Cell (Case) ─────────────────────────────────────────────────────────────
function createCell(id, walkable, groundId, x, y) {
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

function getCellByTilePos(tx, ty) {
  // wrap around
  tx = ((tx % MAP_WIDTH) + MAP_WIDTH) % MAP_WIDTH;
  ty = ((ty % MAP_HEIGHT) + MAP_HEIGHT) % MAP_HEIGHT;
  const idx = ty * MAP_WIDTH + tx;
  return cells[idx] || null;
}

function getCellAtPixel(px, py) {
  const tx = Math.round(Math.round(px) / TILE_SIZE) % MAP_WIDTH;
  const ty = Math.round(Math.round(py) / TILE_SIZE) % MAP_HEIGHT;
  return getCellByTilePos(tx, ty);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Map Initialization ─────────────────────────────────────────────────────
function initializeMap() {
  cells.length = 0; // clear before regenerating
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

      cells.push(createCell(id, walkable, groundId, x, y));
      id++;
    }
  }
}

function getMapData() {
  return cells.map(c => c.id + ',' + c.groundId).join(';');
}

function getRandomWalkableCell() {
  const walkable = cells.filter(c => c.walkable);
  if (walkable.length === 0) return null;
  return walkable[getRandomInt(0, walkable.length - 1)];
}

function getDirCells(cell, dir, range) {
  const result = [];
  for (let i = 1; i < range; i++) {
    let c = null;
    if (dir & DIR.UP)    c = getCellByTilePos(cell.x, cell.y - i);
    if (dir & DIR.RIGHT) c = getCellByTilePos(cell.x + i, cell.y);
    if (dir & DIR.DOWN)  c = getCellByTilePos(cell.x, cell.y + i);
    if (dir & DIR.LEFT)  c = getCellByTilePos(cell.x - i, cell.y);
    if (c) result.push(c);
  }
  return result;
}

function countWalkable(cellList) {
  let n = 0;
  for (const c of cellList) {
    if (c.walkable) n++;
    else break;
  }
  return n;
}

function has3PlacesAround(cell) {
  if (!cell.walkable) return false;
  let nbr = 0;
  nbr += countWalkable(getDirCells(cell, DIR.RIGHT, 3));
  nbr += countWalkable(getDirCells(cell, DIR.LEFT, 3));
  nbr += countWalkable(getDirCells(cell, DIR.DOWN, 3));
  nbr += countWalkable(getDirCells(cell, DIR.UP, 3));
  return nbr > 3;
}

function getRandomWalkableCellStart() {
  const good = cells.filter(c => has3PlacesAround(c));
  if (good.length === 0) return getRandomWalkableCell();
  return good[getRandomInt(0, good.length - 1)];
}

// ─── Player helpers ──────────────────────────────────────────────────────────
function getClientDirection(player) {
  if (player.dir === 0) return player.olddir;
  if (player.dir & DIR.UP)    return 0;
  if (player.dir & DIR.RIGHT) return 1;
  if (player.dir & DIR.DOWN)  return 2;
  if (player.dir & DIR.LEFT)  return 3;
  return player.olddir;
}

function getPlayerCurCell(player) {
  return getCellAtPixel(player.x + 10, player.y + 10);
}

function getPlayerPossibleCell(player, dx, dy) {
  return getCellAtPixel(player.x + 10 + dx, player.y + 10 + dy);
}

function isWalkableCheckBomb(cell, player) {
  if (!cell) return false;
  const curCell = getPlayerCurCell(player);
  if (cell.bomb) {
    if (cell.bomb.launcherId !== player.id) return false;
    if (!curCell || curCell.id !== cell.id) return false;
    return true;
  }
  return cell.walkable;
}

function createPlayer(ws) {
  const spawnCell = getRandomWalkableCellStart();
  const id = nextPlayerId++;
  const p = {
    id,
    x: (spawnCell.x * TILE_SIZE) - 5,
    y: (spawnCell.y * TILE_SIZE) + 10,
    skin: getRandomInt(0, 23),
    dir: 0,         // bitmask direction
    olddir: 2,      // client direction (0=up,1=right,2=down,3=left), default facing down
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
    ws,
  };
  return p;
}

// ─── Broadcast helpers ───────────────────────────────────────────────────────
function broadcast(message, excludeWs) {
  for (const [ws] of players) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

function broadcastAll(message) {
  for (const [ws] of players) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

function sendTo(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  }
}

// ─── Bomb System ─────────────────────────────────────────────────────────────
function addBomb(player) {
  const cell = getPlayerCurCell(player);
  if (!cell) return;
  if (cell.bomb) return;
  if (player.bombCounter >= player.maxBombs) return;

  player.bombCounter++;

  const bomb = {
    id: nextBombId++,
    x: cell.x * TILE_SIZE,
    y: cell.y * TILE_SIZE,
    launcherId: player.id,
    cell,
    range: player.range,
    hasExploded: false,
    timer: null,
  };

  cell.bomb = bomb;
  bombs.push(bomb);

  broadcastAll('BA' + bomb.id + '|' + bomb.x + '|' + bomb.y + '|' + bomb.range);

  bomb.timer = setTimeout(() => explodeBomb(bomb), BOMB_TIMER_MS);
}

function explodeLine(cellList, bomb) {
  let count = 0;
  const brokenWalls = [];
  const chainBombs = [];

  for (const cell of cellList) {
    // check if player is on this cell => kill them
    for (const [, p] of players) {
      if (!p.alive) continue;
      const pCell = getPlayerCurCell(p);
      if (pCell && pCell.id === cell.id) {
        killPlayer(p, bomb);
      }
    }

    // Destroy items on explosion-affected cells
    if (cell.item) {
      despawnItem(cell.item);
    }

    if (cell.bomb) {
      chainBombs.push(cell.bomb);
      break;
    } else if (!cell.walkable && cell.groundId === 104) {
      // destructible wall
      cell.walkable = true;
      cell.groundId = 0;
      sendCellUpdate(cell);
      brokenWalls.push(cell);
      count++;
      break;
    } else if (!cell.walkable && cell.groundId === 80) {
      // cracked wall
      cell.groundId = 81;
      sendCellUpdate(cell);
      break;
    } else if (!cell.walkable) {
      break;
    }
    count++;
  }
  return { count, brokenWalls, chainBombs };
}

function explodeBomb(bomb) {
  if (bomb.hasExploded) {
    bomb.cell.bomb = null;
    removeBomb(bomb);
    return;
  }
  bomb.cell.bomb = null;
  removeBomb(bomb);
  if (bomb.timer) clearTimeout(bomb.timer);
  bomb.timer = null;
  bomb.hasExploded = true;

  // restore bomb counter for launcher
  const launcher = findPlayerById(bomb.launcherId);
  if (launcher) {
    launcher.bombCounter = Math.max(0, launcher.bombCounter - 1);
  }

  const cell = bomb.cell;
  const sup   = explodeLine(getDirCells(cell, DIR.UP, bomb.range), bomb);
  const down  = explodeLine(getDirCells(cell, DIR.DOWN, bomb.range), bomb);
  const left  = explodeLine(getDirCells(cell, DIR.LEFT, bomb.range), bomb);
  const right = explodeLine(getDirCells(cell, DIR.RIGHT, bomb.range), bomb);

  // check center cell for player kills
  for (const [, p] of players) {
    if (!p.alive) continue;
    const pCell = getPlayerCurCell(p);
    if (pCell && pCell.id === cell.id) {
      killPlayer(p, bomb);
    }
  }

  // Destroy item on center cell
  if (cell.item) {
    despawnItem(cell.item);
  }

  broadcastAll('BE' + bomb.id + '|' + sup.count + '|' + down.count + '|' + left.count + '|' + right.count);

  // chain explosions
  const allChainBombs = [
    ...sup.chainBombs,
    ...down.chainBombs,
    ...left.chainBombs,
    ...right.chainBombs,
  ];
  for (const b of allChainBombs) {
    setTimeout(() => explodeBomb(b), 1);
  }

  // spawn items from broken walls
  const allBrokenWalls = [
    ...sup.brokenWalls,
    ...down.brokenWalls,
    ...left.brokenWalls,
    ...right.brokenWalls,
  ];
  for (const wallCell of allBrokenWalls) {
    trySpawnItem(wallCell);
  }
}

function removeBomb(bomb) {
  const idx = bombs.indexOf(bomb);
  if (idx !== -1) bombs.splice(idx, 1);
}

function sendCellUpdate(cell) {
  broadcastAll('WC' + cell.groundId + '|' + cell.x + '|' + cell.y);
}

function findPlayerById(id) {
  for (const [, p] of players) {
    if (p.id === id) return p;
  }
  return null;
}

function killPlayer(player, bomb) {
  if (!player.alive) return; // already dead

  player.alive = false;
  player.deaths++;
  player.dir = 0;
  player.onmove = false;

  // Find killer via bomb launcher
  let killer = null;
  if (bomb) {
    killer = findPlayerById(bomb.launcherId);
  }

  // Increment killer's kills (unless self-kill)
  if (killer && killer.id !== player.id) {
    killer.kills++;
  }

  // Broadcast kill feed: KF{killerId}|{killerNick}|{victimId}|{victimNick}
  const killerId = killer ? killer.id : '';
  const killerNick = killer ? killer.nickname : '';
  broadcastAll('KF' + killerId + '|' + killerNick + '|' + player.id + '|' + player.nickname);

  // Broadcast player death: PK{id}
  broadcastAll('PK' + player.id);

  // Broadcast updated scoreboard
  broadcastScoreboard();

  // Check if round should end
  checkRoundEnd();
}

function broadcastScoreboard() {
  const entries = [];
  for (const [, p] of players) {
    entries.push(p.id + '|' + p.nickname + '|' + p.kills + '|' + p.deaths);
  }
  broadcastAll('SB' + entries.join(';'));
}

// ─── Item System ─────────────────────────────────────────────────────────────
function trySpawnItem(cell) {
  if (cell.bomb) return;

  let templateId = -1;
  if (getRandomInt(1, 10) > 8) templateId = 0; // extra bomb
  if (getRandomInt(1, 10) > 8) templateId = 4; // range up
  if (getRandomInt(1, 10) > 8) templateId = 6; // speed up
  if (templateId === -1) return;

  const item = {
    id: nextItemId++,
    templateId,
    x: cell.x * TILE_SIZE,
    y: cell.y * TILE_SIZE,
    cell,
    timer: null,
  };
  cell.item = item;
  items.push(item);

  broadcastAll('IA' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);

  // Items persist until collected or destroyed by explosion (no auto-despawn)
  item.timer = null;
}

function despawnItem(item) {
  if (item.cell) item.cell.item = null;
  const idx = items.indexOf(item);
  if (idx !== -1) items.splice(idx, 1);
  broadcastAll('ID' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);
}

function pickupItem(player, item) {
  if (item.timer) clearTimeout(item.timer);
  if (item.cell) item.cell.item = null;
  const idx = items.indexOf(item);
  if (idx !== -1) items.splice(idx, 1);

  // Apply effect
  if (item.templateId === 0) {
    // extra bomb
    player.maxBombs++;
  }
  if (item.templateId === 4) {
    // range up
    player.range++;
  }
  if (item.templateId === 6) {
    // speed up
    player.speed += 0.1;
    broadcastAll('IS' + player.id + '|' + player.speed);
  }

  broadcastAll('ID' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);
}

// ─── Round State Machine ────────────────────────────────────────────────────
function startRound() {
  roundState.state = 'active';
  roundState.startTime = Date.now();
  roundState.roundNumber++;

  // Reset all player stats and respawn
  for (const [, p] of players) {
    p.kills = 0;
    p.deaths = 0;
    p.alive = true;
    p.speed = DEFAULT_SPEED;
    p.range = DEFAULT_RANGE;
    p.maxBombs = DEFAULT_MAX_BOMBS;
    p.bombCounter = 0;

    // Respawn player to a new position
    const spawnCell = getRandomWalkableCellStart();
    if (spawnCell) {
      p.x = (spawnCell.x * TILE_SIZE) - 5;
      p.y = (spawnCell.y * TILE_SIZE) + 10;
      p.dir = 0;
      p.olddir = 2;
      p.onmove = false;
    }

    // Broadcast updated position
    broadcastAll('PM' + p.id
      + '|' + p.x
      + '|' + p.y
      + '|' + getClientDirection(p)
      + '|' + p.skin
      + '|' + p.dir
      + '|' + p.onmove
      + '|' + p.nickname);
  }

  // Broadcast round state
  broadcastAll('RS' + 'active' + '|' + ROUND_DURATION_MS);

  // Start countdown timer — end round when time runs out
  if (roundState.timer) clearTimeout(roundState.timer);
  roundState.timer = setTimeout(() => {
    if (roundState.state === 'active') {
      // Time ran out — find player with most kills as winner
      let winner = null;
      let bestKills = -1;
      for (const [, p] of players) {
        if (p.alive && (p.kills > bestKills || (p.kills === bestKills && winner === null))) {
          bestKills = p.kills;
          winner = p;
        }
      }
      endRound(winner ? winner.id : null, winner ? winner.nickname : null);
    }
  }, ROUND_DURATION_MS);

  // Start broadcasting time remaining every second
  if (roundState.timeInterval) clearInterval(roundState.timeInterval);
  roundState.timeInterval = setInterval(() => {
    if (roundState.state === 'active') {
      broadcastRoundState();
    } else {
      clearInterval(roundState.timeInterval);
      roundState.timeInterval = null;
    }
  }, 1000);
}

function endRound(winnerId, winnerNickname) {
  roundState.state = 'ended';

  // Clear round timer
  if (roundState.timer) {
    clearTimeout(roundState.timer);
    roundState.timer = null;
  }

  // Clear time broadcast interval
  if (roundState.timeInterval) {
    clearInterval(roundState.timeInterval);
    roundState.timeInterval = null;
  }

  // Broadcast winner
  broadcastAll('RW' + (winnerId || '') + '|' + (winnerNickname || ''));

  // Build and broadcast full results
  // Format: RE{winnerId}|{winnerNick}|{p1Id}|{p1Nick}|{p1Kills}|{p1Deaths};{p2Id}|...
  const playerResults = [];
  for (const [, p] of players) {
    playerResults.push(p.id + '|' + p.nickname + '|' + (p.kills || 0) + '|' + (p.deaths || 0));
  }
  const resultsStr = 'RE' + (winnerId || '') + '|' + (winnerNickname || '') + '|' + playerResults.join(';');
  roundState.lastResults = resultsStr; // cache for late joiners
  broadcastAll(resultsStr);

  // Broadcast ended state
  broadcastAll('RS' + 'ended' + '|0');

  // After display time, reset the round
  setTimeout(() => {
    resetRound();
  }, ROUND_END_DISPLAY_MS);
}

function resetRound() {
  // Clear all bombs and their timers
  for (const b of bombs) {
    if (b.timer) clearTimeout(b.timer);
    if (b.cell) b.cell.bomb = null;
  }
  bombs.length = 0;

  // Clear all items and their timers
  for (const item of items) {
    if (item.timer) clearTimeout(item.timer);
    if (item.cell) item.cell.item = null;
  }
  items.length = 0;

  // Regenerate map
  cells.length = 0;
  initializeMap();

  // Reset all players for new round
  for (const [, player] of players) {
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
    // Respawn at random walkable position
    const spawnCell = getRandomWalkableCellStart();
    if (spawnCell) {
      player.x = (spawnCell.x * TILE_SIZE) - 5;
      player.y = (spawnCell.y * TILE_SIZE) + 10;
    }
  }

  // Broadcast round reset then new map data
  broadcastAll('RR');
  broadcastAll('WL' + MAP_WIDTH + '|' + MAP_HEIGHT + '|' + getMapData());

  // Send entity data (PA messages) for all players to each client
  for (const [ws, player] of players) {
    // Send self
    sendTo(ws, 'PA' + player.id
      + '|' + player.x
      + '|' + player.y
      + '|' + getClientDirection(player)
      + '|' + player.skin
      + '|' + player.speed
      + '|1'
      + '|' + player.nickname);

    // Send other players
    for (const [otherWs, otherPlayer] of players) {
      if (otherWs === ws) continue;
      sendTo(ws, 'PA' + otherPlayer.id
        + '|' + otherPlayer.x
        + '|' + otherPlayer.y
        + '|' + getClientDirection(otherPlayer)
        + '|' + otherPlayer.skin
        + '|' + otherPlayer.speed
        + '|0'
        + '|' + otherPlayer.nickname);
    }
  }

  // Set state to waiting
  roundState.state = 'waiting';

  // Check if enough players to auto-start (with delay to allow clients to load)
  if (players.size >= MIN_PLAYERS_TO_START) {
    setTimeout(() => {
      if (roundState.state === 'waiting' && players.size >= MIN_PLAYERS_TO_START) {
        startRound();
      }
    }, 2000);
  }
}

function checkRoundEnd() {
  if (roundState.state !== 'active') return;

  let aliveCount = 0;
  let lastAlive = null;
  for (const [, p] of players) {
    if (p.alive) {
      aliveCount++;
      lastAlive = p;
    }
  }

  if (aliveCount <= 1) {
    endRound(
      lastAlive ? lastAlive.id : null,
      lastAlive ? lastAlive.nickname : null
    );
  }
}

function broadcastRoundState() {
  const timeRemaining = roundState.state === 'active'
    ? Math.max(0, ROUND_DURATION_MS - (Date.now() - roundState.startTime))
    : 0;
  broadcastAll('RS' + roundState.state + '|' + timeRemaining);
}

// ─── Movement ────────────────────────────────────────────────────────────────
function movePlayer(player) {
  if (!player.alive) return;
  if (!player.onmove) return;

  const speed = player.speed;

  if (player.dir & DIR.UP) {
    const c = getPlayerPossibleCell(player, 0, -speed);
    if (!c || !isWalkableCheckBomb(c, player)) {
      forceKeyUp(player, DIR.UP);
    } else {
      player.y -= speed;
    }
  }
  if (player.dir & DIR.DOWN) {
    const c = getPlayerPossibleCell(player, 0, speed + 2);
    if (!c || !isWalkableCheckBomb(c, player)) {
      forceKeyUp(player, DIR.DOWN);
    } else {
      player.y += speed;
    }
  }
  if (player.dir & DIR.LEFT) {
    const c = getPlayerPossibleCell(player, -speed, 0);
    if (!c || !isWalkableCheckBomb(c, player)) {
      forceKeyUp(player, DIR.LEFT);
    } else {
      player.x -= speed;
    }
  }
  if (player.dir & DIR.RIGHT) {
    const c = getPlayerPossibleCell(player, speed + 12, 0);
    if (!c || !isWalkableCheckBomb(c, player)) {
      forceKeyUp(player, DIR.RIGHT);
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
  const curCell = getPlayerCurCell(player);
  if (curCell && curCell.item) {
    pickupItem(player, curCell.item);
  }
}

function forceKeyUp(player, binDir) {
  if (player.dir & binDir) {
    player.dir -= binDir;
  }
  if (player.dir < 0) player.dir = 0;
  if (player.dir === 0) player.onmove = false;

  broadcastAll('PS' + player.id
    + '|' + player.x
    + '|' + player.y
    + '|' + getClientDirection(player)
    + '|' + player.skin
    + '|' + player.dir
    + '|' + player.onmove
    + '|' + player.nickname);
}

// ─── Message Handlers ────────────────────────────────────────────────────────
function handleKeyDown(player, message) {
  if (!player.alive) return;
  const key = parseInt(message.substring(2), 10);
  if (isNaN(key)) return;

  const speed = player.speed;

  // Space = bomb
  if (key === 32) {
    addBomb(player);
    return;
  }

  let d = null;
  if (key === 38 || key === 87) {
    d = DIR.UP;
    const c = getPlayerPossibleCell(player, 0, -speed);
    if (c && !isWalkableCheckBomb(c, player)) d = null;
  }
  if (key === 40 || key === 83) {
    d = DIR.DOWN;
    const c = getPlayerPossibleCell(player, 0, speed + 2);
    if (c && !isWalkableCheckBomb(c, player)) d = null;
  }
  if (key === 37 || key === 65) {
    d = DIR.LEFT;
    const c = getPlayerPossibleCell(player, -speed, 0);
    if (c && !isWalkableCheckBomb(c, player)) d = null;
  }
  if (key === 39 || key === 68) {
    d = DIR.RIGHT;
    const c = getPlayerPossibleCell(player, speed + 12, 0);
    if (c && !isWalkableCheckBomb(c, player)) d = null;
  }

  if (d === null) return;
  if ((d & player.dir) !== 0) return; // already pressing this direction

  player.dir += d;
  if (player.dir !== 0) player.olddir = getClientDirection(player);
  player.onmove = true;

  broadcastAll('PM' + player.id
    + '|' + player.x
    + '|' + player.y
    + '|' + getClientDirection(player)
    + '|' + player.skin
    + '|' + player.dir
    + '|' + player.onmove
    + '|' + player.nickname);
}

function handleKeyUp(player, message) {
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

  broadcastAll('PS' + player.id
    + '|' + player.x
    + '|' + player.y
    + '|' + getClientDirection(player)
    + '|' + player.skin
    + '|' + player.dir
    + '|' + player.onmove
    + '|' + player.nickname);
}

function handleChatMessage(player, message) {
  const msg = message.substring(2);
  if (!msg || msg.length === 0) return;
  broadcastAll('MN' + player.nickname + '|' + msg);
}

function handleWorldLoad(player, ws) {
  sendTo(ws, 'WL' + MAP_WIDTH + '|' + MAP_HEIGHT + '|' + getMapData());
}

function handleWorldEntities(player, ws) {
  // Send self (bcurrent = 1)
  sendTo(ws, 'PA' + player.id
    + '|' + player.x
    + '|' + player.y
    + '|' + getClientDirection(player)
    + '|' + player.skin
    + '|' + player.speed
    + '|1'
    + '|' + player.nickname);

  // Send existing bombs
  for (const b of bombs) {
    sendTo(ws, 'BA' + b.id + '|' + b.x + '|' + b.y + '|' + b.range);
  }

  // Send existing items
  for (const item of items) {
    sendTo(ws, 'IA' + item.id + '|' + item.templateId + '|' + item.x + '|' + item.y);
  }

  // Send other players to this client, and notify others about this player
  for (const [otherWs, otherPlayer] of players) {
    if (otherWs === ws) continue;

    // Tell new client about existing player
    sendTo(ws, 'PA' + otherPlayer.id
      + '|' + otherPlayer.x
      + '|' + otherPlayer.y
      + '|' + getClientDirection(otherPlayer)
      + '|' + otherPlayer.skin
      + '|' + otherPlayer.speed
      + '|0'
      + '|' + otherPlayer.nickname);

    // Tell existing player about new client
    sendTo(otherWs, 'PA' + player.id
      + '|' + player.x
      + '|' + player.y
      + '|' + getClientDirection(player)
      + '|' + player.skin
      + '|' + player.speed
      + '|0'
      + '|' + player.nickname);
  }

  // Send current round state to newly connected player
  const timeRemaining = roundState.state === 'active'
    ? Math.max(0, ROUND_DURATION_MS - (Date.now() - roundState.startTime))
    : 0;
  sendTo(ws, 'RS' + roundState.state + '|' + timeRemaining);

  // Send current scoreboard
  broadcastScoreboard();

  // If round is ended, send cached results screen data
  if (roundState.state === 'ended' && roundState.lastResults) {
    sendTo(ws, roundState.lastResults);
  }

  // Auto-start round if enough players and currently waiting (3s delay for client to load)
  if (roundState.state === 'waiting' && players.size >= MIN_PLAYERS_TO_START) {
    setTimeout(() => {
      if (roundState.state === 'waiting' && players.size >= MIN_PLAYERS_TO_START) {
        startRound();
      }
    }, 3000);
  }
}

function handleNicknameInit(player, message) {
  // NI{nickname}|{skinId}
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

function processMessage(ws, player, message) {
  if (!message || message.length < 2) return;

  const type = message.charAt(0);
  const action = message.charAt(1);

  switch (type) {
    case 'K':
      if (action === 'D') handleKeyDown(player, message);
      if (action === 'U') handleKeyUp(player, message);
      break;
    case 'M':
      if (action === 'N') handleChatMessage(player, message);
      break;
    case 'P':
      if (action === 'M') {
        // Client position sync — ignored on authoritative server
      }
      break;
    case 'W':
      if (action === 'L') handleWorldLoad(player, ws);
      if (action === 'E') handleWorldEntities(player, ws);
      break;
    case 'N':
      if (action === 'I') handleNicknameInit(player, message);
      break;
  }
}

// ─── Game Tick (60 fps server-side movement) ─────────────────────────────────
function gameTick() {
  for (const [, player] of players) {
    movePlayer(player);
  }
}

// ─── Server Setup ────────────────────────────────────────────────────────────
initializeMap();
console.log(`Map initialized: ${MAP_WIDTH}x${MAP_HEIGHT} (${cells.length} cells)`);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bomber WebSocket Server\n');
});

const wss = new WebSocket.Server({ server, path: '/echo' });

wss.on('connection', (ws) => {
  const player = createPlayer(ws);
  players.set(ws, player);
  console.log(`Player ${player.id} connected (${players.size} players online)`);

  ws.on('message', (data) => {
    const raw = data.toString();
    // Protocol uses ^ as packet separator
    const packets = raw.split('^');
    for (const packet of packets) {
      if (packet.length > 0) {
        processMessage(ws, player, packet);
      }
    }
  });

  ws.on('close', () => {
    console.log(`Player ${player.id} disconnected`);
    // Broadcast disconnect
    broadcast('PD' + player.id);
    players.delete(ws);

    // If round is active, check if round should end
    if (roundState.state === 'active') {
      checkRoundEnd();
    }
  });

  ws.on('error', (err) => {
    console.error(`Player ${player.id} error:`, err.message);
  });
});

// Start game tick
const tickInterval = setInterval(gameTick, TICK_MS);

server.listen(PORT, () => {
  console.log(`Bomber WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/echo`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  clearInterval(tickInterval);
  // Clear round timers
  if (roundState.timer) clearTimeout(roundState.timer);
  if (roundState.timeInterval) clearInterval(roundState.timeInterval);
  // Clear all bomb/item timers
  for (const b of bombs) {
    if (b.timer) clearTimeout(b.timer);
  }
  for (const item of items) {
    if (item.timer) clearTimeout(item.timer);
  }
  wss.close();
  server.close();
  process.exit(0);
});
