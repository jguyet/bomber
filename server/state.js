const state = {
  nextPlayerId: 0,
  nextBombId: 0,
  nextItemId: 0,
  cases: [],
  players: new Map(),
  bombs: new Map(),
  items: new Map(),
  currentMapTemplate: null
};

module.exports = state;
