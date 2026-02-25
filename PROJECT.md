# Bomber — Bomberman Multiplayer Game

A multiplayer Bomberman-style game with a Node.js/Socket.io server and a canvas-based browser client.

---

## Architecture

### Stack
- **Game Server**: Node.js + Socket.io (port 9998) — rewritten from Java
- **HTTP Server**: Node.js HTTP (port 8060) — serves static files
- **Client**: Vanilla JS + Canvas (Fosfo library)

### Files
```
bomber/
├── server.js           # Node.js game server (Socket.io) — main entry point
├── http_server.js      # Static file HTTP server (port 8060)
├── package.json        # Dependencies (socket.io ^4.7.5)
├── index.html          # Game client HTML
├── js/
│   ├── aks.js          # Socket.io client connection & message handler
│   ├── globals.js      # Global client variables
│   ├── initworld.js    # Game loop (60 FPS)
│   ├── events.js       # Keyboard/mouse input
│   ├── chat.js         # Chat UI
│   ├── world/world.js  # Client world/map rendering
│   ├── player/player.js # Client player entity
│   ├── bomb/bomb.js    # Client bomb animation
│   └── canvas/fosfo.js # Canvas rendering library
├── assets/             # Game sprites (maps, bombs, characters)
├── css/                # Stylesheets
└── server/             # Original Java server (reference only)
```

---

## Running the Game

```bash
# Install dependencies
npm install

# Start the game server (WebSocket, port 9998)
node server.js

# In a separate terminal, start the HTTP server (static files, port 8060)
node http_server.js

# Open browser at: http://localhost:8060
```

---

## Message Protocol

All messages are plain text strings with a 2-character prefix `[TYPE][ACTION]`.

### Client → Server

| Message | Description |
|---------|-------------|
| `WL` | Request world data on connection |
| `KD{key}` | Key down (38/87=up, 40/83=down, 37/65=left, 39/68=right, 32=bomb) |
| `KU{key}` | Key up |
| `MN{text}` | Send chat message |

### Server → Client

| Message | Description |
|---------|-------------|
| `WL{w}\|{h}\|{cells}` | World map data (cells: `id,ground;...`) |
| `WC{ground}\|{x}\|{y}\|{walkable}` | Cell updated (block destroyed) |
| `PA{id}\|{x}\|{y}\|{dir}\|{skin}\|{bcurrent}` | Player added (bcurrent=1 means "this is you") |
| `PD{id}` | Player disconnected |
| `PM{id}\|{x}\|{y}\|{dir}\|{skin}\|{bytedir}` | Player moving |
| `PS{id}\|{x}\|{y}\|{dir}\|{skin}\|{bytedir}` | Player stopped |
| `BA{id}\|{x}\|{y}\|{range}` | Bomb placed |
| `BE{id}\|{sup}\|{down}\|{left}\|{right}` | Bomb exploded (with blast ranges) |
| `MN{text}` | Chat message broadcast |
| `GK` | Game kick (disconnect notice) |

---

## Game Logic

### Map
- 40×22 tile grid, each tile = 32px
- Generated randomly on server start:
  - 50% chance: solid wall (ground=104, non-walkable)
  - 25% chance: soft block (ground=80, non-walkable, destroyable)
  - 25% chance: empty (ground=0, walkable)

### Player
- Speed: 1.5 px/frame at 60 FPS
- Direction bitmask: up=4, right=8, down=16, left=32 (combinable)
- Collision detection against tile walkability and bomb occupancy
- On death: respawned at a random valid start cell

### Bomb
- Range: 4 tiles in each cardinal direction
- Timer: 3 seconds before explosion
- Explosion stops at: solid walls (104), other bombs (chain reaction), or first soft block hit
- Soft blocks (80) damaged to state 81; solid blocks (104) destroyed to empty (0)
- Players in blast cells are respawned

### Spawn
- Valid spawn = walkable cell with 3+ clear adjacent spaces in all directions

---

## Socket.io Notes

- Server uses `socket.emit('msg', text)` / `socket.on('msg', handler)`
- Client uses `socket.emit('msg', text)` / `socket.on('msg', handler)`
- Client loads socket.io from `http://localhost:9998/socket.io/socket.io.js`
- Transport: WebSocket only (`transports: ['websocket']`)

---

## Sprint 2 — Unified Server + Code Audit

### Architectural Changes

**Single unified server on port 8060** (replaces two-process setup):
- `server.js` → rewritten as unified Express + Socket.io server on port 8060
- `http_server.js` → deleted (merged into server.js)
- Static assets served by Express at `/`
- REST-ready API namespace at `/api/`
- Socket.io WebSocket at `/ws/` path
- `package.json` → adds `express`, updates scripts (`npm start` = single process)

### Client Changes
- `index.html` → socket.io loaded from `/socket.io/socket.io.js` (same origin, no hardcoded port)
- `js/aks.js` → connect to `window.location.origin` instead of `http://localhost:9998`
- Canvas dimensions: hardcoded `1708×557` replaced with dynamic `window.innerWidth × window.innerHeight`

### Tiling System Fix
- `js/world/world.js` `loadWorld()` → rewritten to tile map in both X and Y directions to cover full canvas at any resolution
- `fosfo.js` `update()` → dup offsets computed dynamically from canvas size, not static values
- Players and bombs rendered with correct tiled offsets (dup array applied to layer1 too)

### Bug Fixes & Cleanup
- Remove all `console.log` debug noise (aks.js sends every message, fosfo logs every image load)
- Fix `world.removeplayer(id)` — currently passes `id` but `splice(indexOf(id))` expects the object
- Fix `globals.js` SCREENWIDTH/SCREENHEIGHT initialized to `100000` (causes incorrect initial layout)
- Fix canvas fixed `width="1708" height="557"` in HTML — must use CSS/JS for responsive sizing
- Fix `onchatpress` in `chat.js` — rebuilds text from charCode (broken for non-ASCII and backspace)
- Fix `undraw` in `fosfo.js` — uses `setTimeout(2000)` retry loop on missing sprite, causes memory leak
- `events.js` IE detection block dead code (`navigator.appName=="Microsoft Internet Explorer"`)
- `player.js` `load2()` function — dead code duplicate of `load()`
- `player.js` `sendpos()` — dead code, never called from game loop
- `initworld.js` `requestAnimFrame()` — computes fps but result never used
- `globals.js` `SIZE` variable — modified by scroll but never used in rendering

### Running (Sprint 2)
```bash
npm install
npm start          # starts unified server on port 8060
# Open browser at: http://localhost:8060
```

---

## Sprint 3 — Player Movement Sync Fix

### Problem Analysis

The player position is desynced between server and client due to several architectural flaws:

1. **Dual movement execution**: The server runs a `setInterval` loop moving the player at ~60fps, AND the client's `player.js update()` also moves the player locally using `bytedir` bitmask. Both execute independently → positions diverge.
2. **`currentPlayer` excluded from `updateplayers()`**: The local player is updated only via `updatelayer1()` → `currentPlayer.update()`, which applies local `bytedir` movement. But the server is also moving this player. The two drift apart.
3. **No periodic server→client position sync**: The server only broadcasts `PM`/`PS` on key events. Between key events, the server moves the player in its loop but never re-broadcasts. The client predicts movement locally but with no correction.
4. **Hard teleport on PM/PS**: `world.moveplayer()` does `player.x = x; player.y = y` immediately → visible jank/teleport for remote players on every key event.
5. **Server `setInterval` vs client `requestAnimationFrame`**: Different tick rates (16ms interval ≠ rAF ~16.67ms), causing cumulative drift.
6. **`getCellPos` modulo bug**: `Math.round(px / TILE_SIZE) % MAP_WIDTH` — if `px` is negative or oversized, the modulo wraps and returns the wrong cell.

### Sprint 3 Solution

**Authoritative server model**: The server is the single source of truth for positions. The client does NOT move players locally; it only renders the last server-confirmed position.

- **Server**: Broadcast authoritative positions every tick (not just on key events). Remove `setInterval` movement loop and instead move players during a single shared game loop tick. Send `PP` (position ping) messages periodically.
- **Client**: Remove client-side movement from `player.js update()`. The local player renders at the server-provided x/y. Remote players lerp smoothly toward the server target position.
- **Interpolation**: Remote players use linear interpolation (lerp) between last-known and current server position to avoid teleport jank.
- **Collision**: Kept server-side only (already correct). Client sends key events; server decides if movement is valid.

### Files Modified
- `server.js` — unified game tick loop, periodic position broadcast, fix `getCellPos` modulo
- `js/player/player.js` — remove local movement from `update()`, add lerp for remote players, separate local/remote rendering path
- `js/world/world.js` — `moveplayer()` sets target position for lerp instead of hard-setting x/y
- `js/aks.js` — handle new `PP` (position ping) message type if added

---

## Sprint 4 — Camera/Viewport System (Player Movement Boundary Fix)

### Problem Analysis

**Bug**: Player cannot move beyond the visible portion of the map. The `dup` system (map tile duplication) was designed to visually fill the canvas when it's wider than the 40×22 tile map (1280×704px). However, users mistake this for an infinite-scroll or larger-map mechanic.

**Root cause — two interconnected issues**:

1. **No camera system**: `fosfo0.x` and `fosfo1.x` are set once to `(window.innerWidth - MAP_WIDTH*32) / 2` and never updated. The player's pixel position is rendered directly at that absolute position. On large screens, the map is centered but the full 40×22 grid is accessible. On small screens, the right portion of the map is off-screen and the player hits the server-side boundary (null cell) before reaching the visual edge — because the server correctly blocks movement at map boundaries (`getCellByGridPos` returns null for out-of-bounds).

2. **Visual duplication confusion**: The `dup` array tiles the background map across the canvas. This was a Sprint 2 fix to avoid black bars. But the `fosfo.update()` applies `dup` offsets only to the background layer (fosfo0/layer0). Players on layer1 are rendered at their raw pixel positions without camera translation. If the player walks to e.g. x=1300 (beyond map edge), the server blocks it — but visually the player appears stuck at the right side of the duplicated background.

### Sprint 4 Solution

**Camera that follows the current player**, scrolling both layers together:

- Compute `cameraX = currentPlayer.x - canvas.width/2` and `cameraY = currentPlayer.y - canvas.height/2`
- Clamp camera to not scroll past the map bounds: `cameraX = clamp(0, MAP_W_PX - canvas.width, cameraX)` (or allow free scroll if map smaller than canvas)
- Apply camera offset to `fosfo0.x` and `fosfo1.x` each frame (negate: `fosfo0.x = -cameraX + centeringOffset`)
- The `dup` system is simplified: only needed when the map is smaller than the canvas (no change to existing dup logic, just the camera offset is applied first)
- Bomb positions also need camera-aware rendering (they are on fosfo1/layer1)

### Files Modified
- `js/events.js` — `resize()` function: camera offset calculation, `updatelayer1()`: apply camera to fosfo1 each frame
- `js/world/world.js` — expose `getCameraOffset()` helper, or store camera state in world
- `js/initworld.js` — `interval()`: recompute camera offset from currentPlayer each tick before rendering
- `js/globals.js` — add `MAP_WIDTH_PX`, `MAP_HEIGHT_PX` constants for camera clamping

---

## Sprint 5 — Bug Fixes (Map Dup Navigation + Position Wrapping) + Chain Explosion Delay

### Bug 1 — Map duplication navigation non-functional

**Root cause**: The `dup` system visually tiles the map across the entire canvas. However, the server's `Player.getPossibleCell()` and `Player.getCurCell()` check pixel coordinates directly against primary map bounds (`[0, MAP_WIDTH*TILE_SIZE]`). When the player walks onto a visually-duplicated tile region (x >= 1280 or y >= 704), `getPossibleCell()` returns `null` and movement is blocked. The server must wrap pixel coordinates modulo the map dimensions before cell lookups so that duplicate zones are treated as valid map positions.

**Fix in `server.js`**:
- Add a `wrapCoord(px, py)` helper that wraps pixel coordinates: `wx = ((px % MAP_WIDTH_PX) + MAP_WIDTH_PX) % MAP_WIDTH_PX`
- Update `getCellPos(px, py)` to use `wrapCoord` before computing grid index
- Update `Player.getPossibleCell(dx, dy)` to remove the hard boundary check (`nx < 0 || nx >= MAP_WIDTH*TILE_SIZE`) and instead wrap coordinates
- Update `Player.getCurCell()` to wrap its center offset through `wrapCoord`

### Bug 2 — Position wrapping teleport on multiples of map size

**Root cause**: When a player is at pixel position `x = 0` (start of primary map, which is also a multiple of `MAP_WIDTH_PX = 1280`) and moves left, `x -= 1.5` → `x = -1.5`. Without wrapping, `getCellPos(-1.5, ...)` returns `null` (blocked). With the naive fix (`x % MAP_WIDTH_PX`), JS modulo of a negative number returns a negative result, wrapping `x = -1.5` to `-1.5` not `1278.5`. The correct fix is `((x % MAP_WIDTH_PX) + MAP_WIDTH_PX) % MAP_WIDTH_PX` for both X and Y to handle negative coordinates properly.

**Additionally**: The client-side `player.getpos()` uses `Math.round(this.x / 32) % world.width` which also breaks when `x` is a perfect multiple of map width. Update it to use the same double-modulo pattern.

**Fix in `server.js`**: Ensure the `wrapCoord` helper uses the double-modulo pattern `((v % size) + size) % size` for both axes.
**Fix in `js/player/player.js`**: Update `getpos()` to `((Math.round(this.x / 32) % world.width) + world.width) % world.width`.

### New Feature — Chain Explosion Delay

**Problem**: In `server.js` `Bomb.explodeLine()`, when a blast cell contains another bomb (`cell.hasBomb()`), `cell.bomb.explode(io)` is called **synchronously and immediately**. All bombs in a chain detonate in the same millisecond — no dodge window for players.

**Solution**: Introduce a configurable delay constant `CHAIN_EXPLOSION_DELAY_MS = 350` in `server.js`. When a bomb triggers a chain reaction, schedule the chained bomb's explosion with `setTimeout(() => cell.bomb.explode(io), CHAIN_EXPLOSION_DELAY_MS)` instead of calling it directly. The `haveExploded` guard already prevents double-explosions. The client requires no changes (it already handles individual `BE` messages independently).

**Fix in `server.js`**:
- Add `const CHAIN_EXPLOSION_DELAY_MS = 350;` to the configuration section
- In `Bomb.explodeLine()`, replace direct `cell.bomb.explode(io)` with `setTimeout(() => { if (!cell.bomb.haveExploded) cell.bomb.explode(io); }, CHAIN_EXPLOSION_DELAY_MS)`

### Files Modified (Sprint 5)
- `server.js` — `getCellPos()`, `Player.getCurCell()`, `Player.getPossibleCell()`, `Bomb.explodeLine()`, new `wrapCoord()` helper, `CHAIN_EXPLOSION_DELAY_MS` constant
- `js/player/player.js` — `getpos()` double-modulo fix
