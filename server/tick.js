const { SPEED_BOOST } = require('./config');
const state = require('./state');
const { broadcast } = require('./messaging');

function serverTick(io) {
  for (const [, player] of state.players) {
    if (player.onmove) {
      player.move(io);
      broadcast(io, `PM${player.id}|${Math.round(player.x)}|${Math.round(player.y)}|${player.getClientDirection()}|${player.skin}|${player.dir}|${player.nickname}`);
    }
    const playerCell = player.getCurCell();
    if (playerCell) {
      for (const [itemId, item] of state.items) {
        if (item.pickedUp) continue;
        if (playerCell.x === item.cellX && playerCell.y === item.cellY) {
          item.pickedUp = true;
          state.items.delete(itemId);
          if (item.type === 'fire') player.bombRange += 1;
          else if (item.type === 'bomb') player.maxBombs += 1;
          else if (item.type === 'boots') player.speed += SPEED_BOOST;
          io.emit('msg', 'IP' + itemId + '|' + player.id);
        }
      }
    }
  }
}

module.exports = { serverTick };
