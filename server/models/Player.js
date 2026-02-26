const { DIR, PLAYER_W, PLAYER_H, TILE_SIZE, BOMB_RANGE, PLAYER_SPEED } = require('../config');
const { getCellPos, getRandomWalkableCellStart } = require('../map');
const { broadcast } = require('../messaging');

class Player {
  constructor(id, x, y, skin, socketId) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.skin = skin;
    this.socketId = socketId;
    this.nickname = 'Player';
    this.dir = 0;
    this.olddir = 1;
    this.onmove = false;
    this.bombRange = BOMB_RANGE;
    this.maxBombs = 1;
    this.activeBombs = 0;
    this.speed = PLAYER_SPEED;
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

  // Inline key-up logic to avoid circular dependency with handlers.js
  _forceKeyUp(msg, io) {
    const key = parseInt(msg.substring(2), 10);

    let d = null;
    if (key === 38 || key === 87) d = DIR.up;
    if (key === 40 || key === 83) d = DIR.down;
    if (key === 37 || key === 65) d = DIR.left;
    if (key === 39 || key === 68) d = DIR.right;

    if (d === null) return;

    if ((d & this.dir) !== 0) {
      this.setDirection(this.dir & ~d);
    }
    if (this.dir === 0) {
      this.onmove = false;
    }

    broadcast(io, `PS${this.id}|${Math.round(this.x)}|${Math.round(this.y)}|${this.getClientDirection()}|${this.skin}|${this.dir}|${this.nickname}`);
  }

  die(io) {
    const spawnCell = getRandomWalkableCellStart();
    this.x = spawnCell.x * TILE_SIZE + (TILE_SIZE - PLAYER_W) / 2;
    this.y = spawnCell.y * TILE_SIZE + (TILE_SIZE - PLAYER_H) / 2;
    this.olddir = 0;
    this.bombRange = BOMB_RANGE;
    this.maxBombs = 1;
    this.activeBombs = 0;
    this.speed = PLAYER_SPEED;
    broadcast(io, `PS${this.id}|${Math.round(this.x)}|${Math.round(this.y)}|${this.getClientDirection()}|${this.skin}|0|${this.nickname}`);
  }
}

module.exports = Player;
