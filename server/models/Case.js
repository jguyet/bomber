class Case {
  constructor(id, walkable, ground, x, y) {
    this.id = id;
    this.walkable = walkable;
    this.ground = ground;
    this.x = x;
    this.y = y;
    this.bomb = null;
  }

  isWalkable() {
    return this.walkable;
  }

  isWalkableCheckBomb(player) {
    if (this.bomb !== null) {
      if (this.bomb.launcher.id === player.id) {
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

module.exports = Case;
