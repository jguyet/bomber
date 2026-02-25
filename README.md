# Bomber

[![license][license-image]][license-url]

Multiplayer Bomberman-style game — Node.js server (Express + Socket.io) with a static HTML/JS client powered by the [Fosfo](https://github.com/jguyet/fosfo) sprite engine.

---

## Architecture

```
bomber/
├── server.js          # Game server (Express + Socket.io, authoritative logic)
├── index.html         # Game client entry point
├── js/                # Client-side game logic
│   └── bomb/          # Bomb rendering helpers
├── util/              # Fosfo engine, background renderer, UI libraries
│   ├── background/    # Tile-map background renderer
│   ├── client/        # Fosfo sprite client (v0.1.26)
│   └── js/            # AngularJS UI controllers, services, entities
└── package.json
```

**Server stack:** Node.js · Express 4 · Socket.io 4
**Client stack:** HTML5 Canvas · Fosfo sprite engine · AngularJS · Lodash · Howler.js

---

## Protocol

All WebSocket messages use a **2-char prefix** (`[TYPE][ACTION]`).

| Direction | Message | Meaning |
|-----------|---------|---------|
| C → S | `WL` | Request world data |
| C → S | `KD<key>` | Key down (arrow/WASD/space) |
| C → S | `KU<key>` | Key up |
| C → S | `MN<text>` | Chat message |
| S → C | `WL<w>\|<h>\|<data>` | World tile data |
| S → C | `WC<ground>\|<x>\|<y>\|<walkable>` | Cell updated |
| S → C | `PA<id>\|<x>\|<y>\|<dir>\|<skin>\|<bcurrent>` | Player added |
| S → C | `PD<id>` | Player disconnected |
| S → C | `PM<id>\|<x>\|<y>\|<dir>\|<skin>\|<bytedir>` | Player moving |
| S → C | `PS<id>\|<x>\|<y>\|<dir>\|<skin>\|<bytedir>` | Player stopped |
| S → C | `BA<id>\|<x>\|<y>\|<range>` | Bomb added |
| S → C | `BE<id>\|<sup>\|<sdown>\|<sleft>\|<sright>` | Bomb exploded |
| S → C | `MN<text>` | Chat broadcast |
| S → C | `GK` | Game kick |

---

## Game Logic

- **Map:** 40×22 grid, randomly generated. Tile IDs: `0` = floor, `80` = soft block (destructible), `104` = hard block (indestructible).
- **Movement:** Server-authoritative at ~60 FPS (`TICK_MS=16`). Direction tracked as a bitmask (`up=4, right=8, down=16, left=32`). Clients send key events; server computes position.
- **Bombs:** 3-second fuse, range 4 tiles. Chain explosions supported. Bomb launcher can walk off their own bomb cell.
- **Respawn:** On death, player teleports to a random walkable cell with ≥3 clear adjacent spaces.
- **Chat:** Messages broadcast as-is to all connected clients.

---

## Installation

```bash
npm install
npm start
# Server starts on http://localhost:8060
```

Open `http://localhost:8060` in your browser to play.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8060` | HTTP + WebSocket port |

---

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| Space | Place bomb |

---

## Camera System (Sprint 4)

The viewport now follows the current player, scrolling smoothly across the full 40×22 map (1280×704 px).

- `cameraX` / `cameraY` globals track the top-left of the visible viewport in world space
- Camera is clamped to map bounds; on screens larger than the map, the map is centered
- Both canvas layers (`fosfo0`, `fosfo1`) move together via `-cameraX`/`-cameraY` offsets applied each frame in the `interval()` loop
- `world.updateDup()` recomputes background tiling each frame based on current camera position
- Server-side boundary collision tightened: `getPossibleCell` now guards all four edges with a unified pixel-bounds check

---

## Configuration (server.js)

| Constant | Default | Description |
|----------|---------|-------------|
| `BOMB_TIMER_MS` | `3000` | Fuse duration (ms) |
| `CHAIN_EXPLOSION_DELAY_MS` | `350` | Delay between chained bomb explosions (ms) |

---

## Docker

```bash
docker build -t bomber .
docker run -p 8060:8060 bomber
```

Health check: `GET /api/ping` — used by Docker `HEALTHCHECK`.
Runs as non-root user `bomber` inside container.

---

## Changelog

### Sprint 5 — Map duplication navigation & chain explosion delay

**Fix: map duplication navigation** (`server.js`)
- Added `wrapCoord(px, py)` helper using double-modulo `((v % size) + size) % size`
- `getCellPos`, `getCurCell`, and `getPossibleCell` updated to wrap through `wrapCoord`
- Hard out-of-bounds check removed from `getPossibleCell` — wrapping replaces it
- Players can now walk continuously into visually duplicated map zones

**Fix: negative coordinate wrapping** (`server.js`, `js/player/player.js`)
- JS `%` returns negative for negative inputs — documented in `wrapCoord` comment
- Client `player.getpos()` fixed: both x and y use `((v % size) + size) % size`
- Prevents `getCellByGridPos` receiving negative grid indices when walking left past x=0

**Feature: chain explosion delay** (`server.js`)
- Constant `CHAIN_EXPLOSION_DELAY_MS = 350` added to config section
- Chained bombs now detonate ~350ms after the triggering explosion (staggered per link)
- Guard on `haveExploded` prevents double-detonation if bomb's own timer fires first
- Players have a visible dodge window between explosions in a chain

---

## Known Issues

- None at time of release. One integration bug was found and fixed during QA (Sprint 4): `resize()` was using a manual inline dup computation that conflicted with `world.updateDup()` — fixed to use the canonical method consistently.

---

[license-image]: https://img.shields.io/npm/l/express.svg
[license-url]: https://tldrlegal.com/license/mit-license
