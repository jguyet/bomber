const { DIR, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } = require('./config');
const state = require('./state');
const { getMapData, getRandomWalkableCellStart } = require('./map');
const Bomb = require('./models/Bomb');
const { broadcast, sendTo } = require('./messaging');

function handleWorldLoad(socket, io) {
  const player = state.players.get(socket.id);
  if (!player) return;

  sendTo(socket, `WL${MAP_WIDTH}|${MAP_HEIGHT}|${state.currentMapTemplate.tileset}|${state.currentMapTemplate.tilesetCols}|${state.currentMapTemplate.tilesetRows}|${getMapData()}`);

  sendTo(socket, `PA${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|1|${player.nickname}`);

  for (const [sid, p] of state.players) {
    if (sid === socket.id) continue;
    sendTo(socket, `PA${p.id}|${p.x}|${p.y}|${p.getClientDirection()}|${p.skin}|0|${p.nickname}`);
  }

  for (const [sid, p] of state.players) {
    if (sid === socket.id) continue;
    const otherSocket = io.sockets.sockets.get(sid);
    if (otherSocket) {
      sendTo(otherSocket, `PA${player.id}|${player.x}|${player.y}|${player.getClientDirection()}|${player.skin}|0|${player.nickname}`);
    }
  }

  for (const [, item] of state.items) {
    if (!item.pickedUp) {
      sendTo(socket, 'IA' + item.id + '|' + item.type + '|' + item.cellX + '|' + item.cellY);
    }
  }
}

function handleKeyDown(message, player, socket, io) {
  const key = parseInt(message.substring(2), 10);

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
  if ((d & player.dir) !== 0) return;

  player.setDirection(player.dir | d);
  player.onmove = true;

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
    player.setDirection(player.dir & ~d);
  }
  if (player.dir === 0) {
    player.onmove = false;
  }

  broadcast(io, `PS${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|${player.dir}|${player.nickname}`);
}

function handleNickname(message, player) {
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
  const text = message.substring(2);
  broadcast(io, `MN${player.nickname}: ${text}`);
}

function addBomb(player, io) {
  const cell = player.getCurCell();
  if (!cell) return;
  if (cell.hasBomb()) return;
  if (player.activeBombs >= player.maxBombs) return;

  const bombId = state.nextBombId++;
  const bx = cell.x * TILE_SIZE;
  const by = cell.y * TILE_SIZE;
  const bomb = new Bomb(bombId, bx, by, player, 1);
  player.activeBombs++;
  bomb.start(io);
  state.bombs.set(bombId, bomb);

  broadcast(io, `BA${bomb.id}|${bomb.x}|${bomb.y}|${bomb.range}`);
}

module.exports = {
  handleWorldLoad,
  handleKeyDown,
  handleKeyUp,
  handleNickname,
  handleChat,
  addBomb
};
