const { BOMB_RANGE, BOMB_TIMER_MS, CHAIN_EXPLOSION_DELAY_MS, ITEM_DROP_CHANCE, ITEM_TYPES, DIR } = require('../config');
const state = require('../state');
const { getDirCells } = require('../map');
const Item = require('./Item');
const { broadcast } = require('../messaging');

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
      let playerDied = false;
      for (const [, player] of state.players) {
        const pcell = player.getCurCell();
        if (pcell && pcell.id === cell.id) {
          player.die(io);
          playerDied = true;
          break;
        }
      }
      if (playerDied) break;

      if (cell.hasBomb()) {
        const chainBomb = cell.bomb;
        setTimeout(() => {
          if (!chainBomb.haveExploded) chainBomb.explode(io);
        }, CHAIN_EXPLOSION_DELAY_MS);
        count++;
        break;
      } else if (!cell.isWalkable() && cell.ground === state.currentMapTemplate.hardGround) {
        break;
      } else if (!cell.isWalkable() && cell.ground === state.currentMapTemplate.softGround) {
        cell.setGround(state.currentMapTemplate.emptyGround);
        cell.setWalkable(true);
        cell.sendCell(io);
        if (Math.random() < ITEM_DROP_CHANCE) {
          const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
          const item = new Item(state.nextItemId++, type, cell.x, cell.y);
          state.items.set(item.id, item);
          io.emit('msg', 'IA' + item.id + '|' + item.type + '|' + item.cellX + '|' + item.cellY);
        }
        count++;
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

    if (cell) cell.setBomb(null);
    state.bombs.delete(this.id);

    if (state.players.has(this.launcher.socketId)) {
      this.launcher.activeBombs = Math.max(0, this.launcher.activeBombs - 1);
    }
  }
}

module.exports = Bomb;
