const PORT = parseInt(process.env.PORT, 10) || 8060;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 22;
const TILE_SIZE = 32;
const PLAYER_SPEED = 1.5;
const BOMB_RANGE = 4;
const BOMB_TIMER_MS = 3000;
const CHAIN_EXPLOSION_DELAY_MS = 350;
const ITEM_DROP_CHANCE = 0.50;
const ITEM_TYPES = ['fire', 'bomb', 'boots'];
const SPEED_BOOST = 0.3;
const PLAYER_W = 14;
const PLAYER_H = 14;
const DIR = {
  up:    4,
  right: 8,
  down:  16,
  left:  32
};
const TICK_MS = 16;

module.exports = {
  PORT, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, PLAYER_SPEED, BOMB_RANGE,
  BOMB_TIMER_MS, CHAIN_EXPLOSION_DELAY_MS, ITEM_DROP_CHANCE, ITEM_TYPES,
  SPEED_BOOST, PLAYER_W, PLAYER_H, DIR, TICK_MS
};
