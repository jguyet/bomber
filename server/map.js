const { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, DIR } = require('./config');
const { randomInt } = require('./utils');
const state = require('./state');
const Case = require('./models/Case');

const MAP_TEMPLATES = [
  {
    name: 'classic',
    tileset: 'assets/maps/1.png',
    tilesetCols: 8,
    tilesetRows: 24,
    emptyGround: 0,
    softGround: 104,
    hardGround: 80,
    softDensity: 0.60,
  },
  {
    name: 'winter',
    tileset: 'assets/maps/1-winter.png',
    tilesetCols: 8,
    tilesetRows: 30,
    emptyGround: 0,
    softGround: 104,
    hardGround: 80,
    softDensity: 0.55,
  },
  {
    name: 'moon',
    tileset: 'assets/maps/tileset-moon.png',
    tilesetCols: 10,
    tilesetRows: 32,
    emptyGround: 0,
    softGround: 104,
    hardGround: 80,
    softDensity: 0.50,
  },
  {
    name: 'ruins',
    tileset: 'assets/maps/1.png',
    tilesetCols: 8,
    tilesetRows: 24,
    emptyGround: 0,
    softGround: 104,
    hardGround: 80,
    softDensity: 0.70,
  },
];

function isSpawnCorner(cx, cy) {
  if (cx < 3 && cy < 3) return true;
  if (cx >= MAP_WIDTH - 3 && cy < 3) return true;
  if (cx < 3 && cy >= MAP_HEIGHT - 3) return true;
  if (cx >= MAP_WIDTH - 3 && cy >= MAP_HEIGHT - 3) return true;
  return false;
}

function initializeMap() {
  state.currentMapTemplate = MAP_TEMPLATES[Math.floor(Math.random() * MAP_TEMPLATES.length)];

  state.cases.length = 0;
  let i = 0;

  const { emptyGround, softGround, hardGround, softDensity } = state.currentMapTemplate;

  for (let cy = 0; cy < MAP_HEIGHT; cy++) {
    for (let cx = 0; cx < MAP_WIDTH; cx++) {
      let ground = emptyGround;
      let walkable = true;

      if (isSpawnCorner(cx, cy)) {
        ground = emptyGround;
        walkable = true;
      } else if (cx % 2 === 0 && cy % 2 === 0) {
        ground = hardGround;
        walkable = false;
      } else {
        if (Math.random() < softDensity) {
          ground = softGround;
          walkable = false;
        } else {
          ground = emptyGround;
          walkable = true;
        }
      }

      state.cases.push(new Case(i, walkable, ground, cx, cy));
      i++;
    }
  }
}

function getMapData() {
  return state.cases.map(c => `${c.id},${c.ground}`).join(';');
}

function getCellByGridPos(x, y) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null;
  return state.cases[y * MAP_WIDTH + x] || null;
}

const MAP_WIDTH_PX  = MAP_WIDTH  * TILE_SIZE;
const MAP_HEIGHT_PX = MAP_HEIGHT * TILE_SIZE;

function wrapCoord(px, py) {
  return {
    wx: ((px % MAP_WIDTH_PX)  + MAP_WIDTH_PX)  % MAP_WIDTH_PX,
    wy: ((py % MAP_HEIGHT_PX) + MAP_HEIGHT_PX) % MAP_HEIGHT_PX
  };
}

function getCellPos(px, py) {
  const { wx, wy } = wrapCoord(px, py);
  const gx = Math.floor(wx / TILE_SIZE);
  const gy = Math.floor(wy / TILE_SIZE);
  return getCellByGridPos(gx, gy);
}

function wrapGrid(v, size) {
  return ((v % size) + size) % size;
}

function getDirCells(cell, dir, range) {
  const result = [];
  if ((dir & DIR.up) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x, wrapGrid(cell.y - i, MAP_HEIGHT));
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.right) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(wrapGrid(cell.x + i, MAP_WIDTH), cell.y);
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.down) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(cell.x, wrapGrid(cell.y + i, MAP_HEIGHT));
      if (c) result.push(c);
    }
  }
  if ((dir & DIR.left) !== 0) {
    for (let i = 1; i < range; i++) {
      const c = getCellByGridPos(wrapGrid(cell.x - i, MAP_WIDTH), cell.y);
      if (c) result.push(c);
    }
  }
  return result;
}

function countLeadingWalkable(cellList) {
  let count = 0;
  for (const cell of cellList) {
    if (cell.isWalkable()) count++;
    else break;
  }
  return count;
}

function have3PlacesCell(cell) {
  if (!cell.isWalkable()) return false;
  let nbr = 0;
  nbr += countLeadingWalkable(getDirCells(cell, DIR.right, 3));
  nbr += countLeadingWalkable(getDirCells(cell, DIR.left, 3));
  nbr += countLeadingWalkable(getDirCells(cell, DIR.down, 3));
  nbr += countLeadingWalkable(getDirCells(cell, DIR.up, 3));
  return nbr > 3;
}

function getRandomWalkableCellStart() {
  const eligible = state.cases.filter(c => have3PlacesCell(c));
  if (eligible.length === 0) {
    const walkable = state.cases.filter(c => c.isWalkable());
    if (walkable.length === 0) return state.cases[0];
    return walkable[randomInt(0, walkable.length - 1)];
  }
  return eligible[randomInt(0, eligible.length - 1)];
}

module.exports = {
  MAP_TEMPLATES,
  initializeMap,
  getMapData,
  isSpawnCorner,
  getCellByGridPos,
  wrapCoord,
  getCellPos,
  wrapGrid,
  getDirCells,
  countLeadingWalkable,
  have3PlacesCell,
  getRandomWalkableCellStart
};
