/**
 * Bot AI module — 4 AI bots that behave like real players
 *
 * Bots are normal Player objects in state.players.
 * The 60fps serverTick handles movement/item pickup automatically.
 * This module only handles AI decisions every 300ms.
 */
const { TILE_SIZE, PLAYER_W, PLAYER_H, DIR, MAP_WIDTH, MAP_HEIGHT } = require('./config');
const state = require('./state');
const Player = require('./models/Player');
const { getCellByGridPos, getRandomWalkableCellStart } = require('./map');
const { addBomb } = require('./handlers');
const { broadcast } = require('./messaging');

const BOT_NAMES = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
const BOT_SKINS = [2, 5, 8, 11];
const AI_TICK_MS = 300;
const MAX_BFS_DEPTH = 20;
const STUCK_THRESHOLD = 5;

const S = { WANDER: 0, ATTACK: 1, FLEE: 2, IDLE: 3 };

const bots = [];

function cellKey(x, y) {
  return y * MAP_WIDTH + x;
}

// ─── Spawn ──────────────────────────────────────────────────────────────────

function spawnBots(io) {
  for (let i = 0; i < 4; i++) {
    const socketId = `bot-${i}`;
    const spawnCell = getRandomWalkableCellStart();
    const px = spawnCell.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
    const py = spawnCell.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;

    const playerId = state.nextPlayerId++;
    const player = new Player(playerId, px, py, BOT_SKINS[i], socketId);
    player.nickname = BOT_NAMES[i];
    state.players.set(socketId, player);

    bots.push({
      player,
      state: S.WANDER,
      path: [],
      stuckCell: -1,
      stuckCount: 0,
      idleTicks: 0,
    });
  }

  console.log('Spawned 4 bots');
  setInterval(() => aiTick(io), AI_TICK_MS);
}

// ─── Danger map ─────────────────────────────────────────────────────────────

function getDangerCells() {
  const danger = new Set();
  for (const [, bomb] of state.bombs) {
    if (bomb.haveExploded) continue;
    const cell = bomb.curcell;
    if (!cell) continue;
    danger.add(cellKey(cell.x, cell.y));

    const deltas = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of deltas) {
      for (let i = 1; i < bomb.range; i++) {
        const c = getCellByGridPos(cell.x + dx * i, cell.y + dy * i);
        if (!c) break;
        if (!c.isWalkable() && !c.hasBomb()) break;
        danger.add(cellKey(c.x, c.y));
        if (!c.isWalkable()) break;
      }
    }
  }
  return danger;
}

// ─── BFS pathfinding ────────────────────────────────────────────────────────

function bfs(startX, startY, goalFn) {
  const visited = new Set();
  const queue = [{ x: startX, y: startY, path: [] }];
  visited.add(cellKey(startX, startY));

  while (queue.length > 0) {
    const { x, y, path } = queue.shift();
    if (path.length > MAX_BFS_DEPTH) continue;

    if (path.length > 0 && goalFn(x, y)) {
      return path;
    }

    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = cellKey(nx, ny);
      if (visited.has(key)) continue;
      const c = getCellByGridPos(nx, ny);
      if (!c || !c.isWalkable() || c.hasBomb()) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
    }
  }
  return null;
}

// ─── Movement helpers ───────────────────────────────────────────────────────

function moveToward(bot, targetX, targetY, io) {
  const player = bot.player;
  const cell = player.getCurCell();
  if (!cell) return;

  const dx = targetX - cell.x;
  const dy = targetY - cell.y;

  let newDir = 0;
  if (dx > 0) newDir = DIR.right;
  else if (dx < 0) newDir = DIR.left;
  else if (dy > 0) newDir = DIR.down;
  else if (dy < 0) newDir = DIR.up;

  if (newDir === 0) return;

  // Snap to cell center when changing direction to prevent pixel drift
  if (newDir !== player.dir) {
    player.x = cell.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
    player.y = cell.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;
    player.setDirection(newDir);
  }

  player.onmove = true;
  broadcast(io, `PM${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|${player.dir}|${player.nickname}`);
}

function stopBot(bot, io) {
  const player = bot.player;
  player.setDirection(0);
  player.onmove = false;
  broadcast(io, `PS${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|0|${player.nickname}`);
}

function moveRandom(bot, cx, cy, io) {
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let i = dirs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
  }
  for (const [dx, dy] of dirs) {
    const c = getCellByGridPos(cx + dx, cy + dy);
    if (c && c.isWalkable() && !c.hasBomb()) {
      moveToward(bot, cx + dx, cy + dy, io);
      return;
    }
  }
  stopBot(bot, io);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isAdjacentToSoftWall(x, y) {
  const softGround = state.currentMapTemplate.softGround;
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const c = getCellByGridPos(x + dx, y + dy);
    if (c && !c.isWalkable() && c.ground === softGround) return true;
  }
  return false;
}

// ─── State machine ──────────────────────────────────────────────────────────

function flee(bot, cx, cy, danger, io) {
  // Already safe → short idle then wander
  if (!danger.has(cellKey(cx, cy))) {
    bot.state = S.IDLE;
    bot.idleTicks = 2;
    stopBot(bot, io);
    return;
  }

  const path = bfs(cx, cy, (x, y) => !danger.has(cellKey(x, y)));
  if (path && path.length > 0) {
    moveToward(bot, path[0].x, path[0].y, io);
  } else {
    moveRandom(bot, cx, cy, io);
  }
}

function wander(bot, cx, cy, danger, io) {
  // Arrived next to a soft wall → attack
  if (isAdjacentToSoftWall(cx, cy)) {
    bot.state = S.ATTACK;
    bot.path = [];
    attack(bot, cx, cy, danger, io);
    return;
  }

  // Follow existing path
  if (bot.path.length > 0) {
    const next = bot.path[0];
    if (cx === next.x && cy === next.y) {
      bot.path.shift();
    }
    if (bot.path.length > 0) {
      moveToward(bot, bot.path[0].x, bot.path[0].y, io);
      return;
    }
  }

  // Find path to cell adjacent to a soft wall
  const path = bfs(cx, cy, (x, y) => isAdjacentToSoftWall(x, y));
  if (path && path.length > 0) {
    bot.path = path;
    moveToward(bot, path[0].x, path[0].y, io);
  } else {
    moveRandom(bot, cx, cy, io);
  }
}

function attack(bot, cx, cy, danger, io) {
  const player = bot.player;

  if (!isAdjacentToSoftWall(cx, cy)) {
    bot.state = S.WANDER;
    return;
  }

  // Simulate blast zone to check escape route
  const simDanger = new Set(danger);
  simDanger.add(cellKey(cx, cy));
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    for (let i = 1; i < player.bombRange; i++) {
      const nx = cx + dx * i;
      const ny = cy + dy * i;
      const c = getCellByGridPos(nx, ny);
      if (!c || !c.isWalkable()) break;
      simDanger.add(cellKey(nx, ny));
    }
  }

  const escapePath = bfs(cx, cy, (x, y) => !simDanger.has(cellKey(x, y)));
  if (!escapePath) {
    bot.state = S.WANDER;
    bot.path = [];
    return;
  }

  // Place bomb and flee
  stopBot(bot, io);
  addBomb(player, io);
  bot.state = S.FLEE;
  bot.path = [];
}

function idle(bot, io) {
  stopBot(bot, io);
  bot.idleTicks--;
  if (bot.idleTicks <= 0) {
    bot.state = S.WANDER;
  }
}

// ─── AI tick ────────────────────────────────────────────────────────────────

function aiTick(io) {
  const danger = getDangerCells();

  for (const bot of bots) {
    const player = bot.player;
    if (!state.players.has(player.socketId)) continue;

    const cell = player.getCurCell();
    if (!cell) continue;
    const cx = cell.x, cy = cell.y;
    const curKey = cellKey(cx, cy);

    // Stuck detection
    if (curKey === bot.stuckCell) {
      bot.stuckCount++;
    } else {
      bot.stuckCell = curKey;
      bot.stuckCount = 0;
    }
    if (bot.stuckCount >= STUCK_THRESHOLD) {
      bot.path = [];
      bot.state = S.WANDER;
      bot.stuckCount = 0;
    }

    // Override: if in danger, force FLEE
    if (danger.has(curKey) && bot.state !== S.FLEE) {
      bot.state = S.FLEE;
      bot.path = [];
    }

    switch (bot.state) {
      case S.FLEE: flee(bot, cx, cy, danger, io); break;
      case S.ATTACK: attack(bot, cx, cy, danger, io); break;
      case S.IDLE: idle(bot, io); break;
      default: wander(bot, cx, cy, danger, io); break;
    }
  }
}

module.exports = { spawnBots };
