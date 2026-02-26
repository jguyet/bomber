class Item {
  constructor(id, type, cellX, cellY) {
    this.id = id;
    this.type = type;
    this.cellX = cellX;
    this.cellY = cellY;
    this.pickedUp = false;
  }
}

module.exports = Item;
