# Bomber — Multiplayer Bomberman Game

## Overview
Browser-based multiplayer Bomberman clone. Players connect via WebSocket, move on a tile-based map, place bombs, collect items. Rendered with the custom `fosfo` 2D canvas library.

## Tech Stack
- **Server**: Node.js (replacing original Java server) — WebSocket game server + static HTTP file server
- **Client**: Vanilla HTML / CSS / JavaScript (no framework)
- **Rendering**: Custom `fosfo` canvas engine (`js/canvas/fosfo.js`) — dual-layer canvas (layer0 = map tiles, layer1 = entities)
- **Database**: JSON files in `.db/` directory
- **Libraries**: jQuery 1.9.1, Lodash (client-side)

## Architecture

### Server (`server.js` — NEW in Sprint 1)
Node.js WebSocket server replacing the original Java `server.jar`. Must implement the same binary-text protocol:
- **Player messages**: `PA` (add), `PM` (move), `PD` (disconnect)
- **Bomb messages**: `BA` (add), `BE` (explode)
- **Item messages**: `IA` (add), `ID` (delete), `IS` (speed change)
- **World messages**: `WL` (load), `WR` (reload), `WC` (cell change)
- **Chat messages**: `MN` (message)
- Packets delimited by `^` character

### Client Files
| File | Purpose |
|------|---------|
| `index.html` | Entry point, canvas + chat UI |
| `js/globals.js` | Global state: canvas refs, socket, players array, current player |
| `js/initworld.js` | Asset preloading, world init, game loop (60fps) |
| `js/aks.js` | WebSocket connection, packet parsing, protocol handler |
| `js/events.js` | Keyboard/mouse input, window resize |
| `js/player/player.js` | Player entity: movement, animation, rendering |
| `js/bomb/bomb.js` | Bomb entity: animation states, explosion rendering |
| `js/item/item.js` | Item entity: floating animation, pickup |
| `js/chat.js` | Chat input/output handling |
| `js/world/world.js` | World: map parsing, tile rendering, entity management |
| `js/canvas/fosfo.js` | Custom 2D canvas rendering engine |
| `css/styles.css` | All game styles |
| `http_server.js` | Static file server (port 8060) |

### Assets
| Path | Content |
|------|---------|
| `assets/characters/0-23.png` | 24 character sprite sheets (4x4 grid: up/right/down/left × 4 frames) |
| `assets/characters/ironman.png` | Bonus skin |
| `assets/maps/1.png` | Map tileset (8×24 grid) |
| `assets/bombs/1.png` | Bomb sprite sheet (1×9 grid) |
| `assets/bombs/explode/1.png` | Explosion sprite sheet (4×2 grid) |
| `assets/items/1.png` | Item sprite sheet (3×9 grid) |
| `assets/back42x42.png` | Background tile |
| `i/land/logo.png` | Game logo |

### Protocol Detail
Packets are `^`-separated strings. First char = type, second char = action, remainder = data.
- `WL` → server sends `WL{width}|{height}|{tile;tile;...}` world data
- `WE` → client requests entities after world load
- `PA{id}|{x}|{y}|{dir}|{skin}|{speed}|{isCurrent}` → player added
- `PM{id}|{x}|{y}|{dir}|{skin}|{bytedir}|{isMoving}|{time}` → player moved
- `PD{id}` → player disconnected
- `BA{id}|{x}|{y}|{range}` → bomb placed
- `BE{id}|{sup}|{down}|{left}|{right}` → bomb exploded
- `KD{keycode},{time}` / `KU{keycode},{time}` → key events from client
- `MN{text}` → chat message (client→server and server→client)
- `PM1|{x}|{y}|{animname}|{animid}` → position sync from client
- `TP{x},{y}` → teleport request

---

## Sprint 1 — Player Identity & UX Polish

### New Features

1. **Node.js WebSocket Game Server** (`server.js`)
   - Replace Java `server.jar` with Node.js implementation
   - Same protocol, same game logic (world, bombs, items, players)
   - Player object stores `nickname` and `skinId`
   - JSON database in `.db/` directory for persistence

2. **Nickname System**
   - Pre-connect nickname input screen
   - Nickname sent at connection time (new protocol: `NI{nickname}|{skinId}`)
   - Server stores nickname on player object
   - All broadcasts include nickname (PA, PM messages extended)
   - Player name labels above characters use actual nickname

3. **Chat Sender Attribution**
   - Chat messages include sender nickname instead of hardcoded "unknow"
   - Server attaches sender nickname to MN broadcasts
   - Format: `MN{senderNickname}|{messageText}`

4. **Character Skin Selection**
   - Pre-connect skin picker showing all 24 character sprite sheets
   - Grid preview of each skin with visual selection highlight
   - Selected skin ID sent at connection time with nickname
   - Used in all PA/PM broadcasts

5. **Loading Overlay**
   - Full-screen overlay with progress indicator during asset loading
   - Tracks: map sprites, character sheets, bomb sprites
   - Dismisses only when all assets loaded AND world initialized

6. **Connection State Overlay**
   - Toast/overlay when WebSocket disconnects
   - Shows "Reconnecting..." with attempt count
   - Updates on successful reconnection
   - Shows permanent failure after max retries

7. **SEO & Meta Tags**
   - Favicon (SVG bomb icon)
   - `<title>` tag working cross-browser
   - Open Graph meta tags (og:title, og:description, og:image)
   - Meta description tag

---

## Sprint 2 — Competitive Rounds, Power-ups & Kill Tracking

### Overview
Transforms the endless sandbox into a structured competitive experience with timed rounds, collectible power-ups, kill attribution, and live scoreboards.

### New Features

1. **Round System** (server-side state machine + client UI)
   - Server manages round state: `waiting` → `active` → `ended` → loop
   - Rounds last 3 minutes (configurable `ROUND_DURATION_MS`)
   - Round ends when timer expires OR only one player remains alive
   - At round end: broadcast game-over event with winner identity
   - Display results screen for 5 seconds, then regenerate map and start new round
   - Server broadcasts round state transitions to all clients
   - New protocol messages:
     - `RS{state}|{timeRemainingMs}` — round state update
     - `RW{winnerId}|{winnerNickname}` — round winner announcement
     - `RR` — round reset (new map incoming)

2. **Per-Player Stats** (server-side)
   - Each player object gets: `kills`, `deaths`, `speed`, `range`, `maxBombs` (already exists as per-player properties)
   - Stats reset each round
   - On player death: increment `deaths` on victim, increment `kills` on bomb owner
   - `bomb.launcherId` already exists — used for kill attribution

3. **Kill Tracking & Kill Feed**
   - When `explodeLine()` kills a player, attribute kill to `bomb.launcherId`
   - Self-kills tracked separately (killer === victim)
   - Broadcast kill event to all clients: `KF{killerId}|{killerNickname}|{victimId}|{victimNickname}`
   - Client displays kill feed entries in the chat panel using existing `.kill-info` CSS class
   - Dead players no longer respawn during active round — they spectate until round ends

4. **Power-Up System** (server-side logic enhancement)
   - Existing `trySpawnItem()` already spawns items on wall destruction — enhanced with proper power-up types
   - Three power-up types (using existing `templateId` values):
     - `BombUp` (templateId=0): increases `player.maxBombs` by 1
     - `FireUp` (templateId=4): increases `player.range` by 1
     - `SpeedUp` (templateId=6): increases `player.speed` by 0.1
   - Power-ups persist until collected or destroyed by explosions (remove despawn timer)
   - Explosions destroy uncollected power-ups on affected cells
   - Effects are per-player (already the case), reset each round
   - Server broadcasts power-up positions via existing `IA`/`ID` protocol

5. **HUD Scoreboard** (client-side overlay)
   - Live in-game scoreboard showing all players: nickname, kills, deaths
   - Positioned top-right of viewport, semi-transparent
   - Updated via new protocol message: `SB{playerId}|{nickname}|{kills}|{deaths};...` (all players)
   - Server broadcasts scoreboard state every time kills/deaths change
   - Uses existing CSS infrastructure (`.player-statistics`, `#scoreboard-new`)

6. **Round Timer HUD** (client-side)
   - Countdown timer displayed top-center during active round
   - Shows "Waiting for players..." during waiting state
   - Shows "Round Over!" during ended state
   - Updated from `RS` protocol messages

7. **Results Screen** (client-side overlay)
   - Full-screen overlay shown for 5 seconds at round end
   - Shows winner name, round summary with all players' kills/deaths
   - Auto-dismisses when new round starts (`RR` message)
   - New protocol message for full results: `RE{winnerId}|{winnerNickname}|{p1Id}|{p1Nick}|{p1Kills}|{p1Deaths};...`

### Protocol Additions (Sprint 2)
| Code | Direction | Format | Purpose |
|------|-----------|--------|---------|
| `RS` | server→client | `RS{state}\|{timeRemainingMs}` | Round state update (waiting/active/ended) |
| `RW` | server→client | `RW{winnerId}\|{winnerNickname}` | Round winner |
| `RR` | server→client | `RR` | Round reset — new map incoming |
| `RE` | server→client | `RE{winnerId}\|{winnerNick}\|{id}\|{nick}\|{kills}\|{deaths};...` | Round end results |
| `KF` | server→client | `KF{killerId}\|{killerNick}\|{victimId}\|{victimNick}` | Kill feed event |
| `SB` | server→client | `SB{id}\|{nick}\|{kills}\|{deaths};...` | Scoreboard update |

### Modified Files
| File | Changes |
|------|---------|
| `server.js` | Round state machine, kill tracking, per-player stats, power-up persistence, explosion-destroys-items, dead=spectator logic |
| `js/aks.js` | Handle RS, RW, RR, RE, KF, SB protocol messages |
| `js/globals.js` | New globals for round state, scoreboard data |
| `index.html` | HUD scoreboard container, round timer container, results screen overlay |
| `css/hud.css` | NEW — Styles for HUD scoreboard, round timer, results screen |
| `js/hud.js` | NEW — HUD manager: scoreboard rendering, timer display, results screen |
| `js/events.js` | Block player input when dead/spectating |

### Architecture Notes
- Round state is authoritative on server; clients just render what server tells them
- Per-player stats (`kills`, `deaths`, `speed`, `range`, `maxBombs`) already exist on player object — just need reset logic per round
- Dead players stay connected but can't move/place bombs until next round
- Power-ups no longer auto-despawn (removed `ITEM_DESPAWN_MS` timeout for power-ups)
- Explosions now check `cell.item` and destroy items on affected cells

---

## Sprint 3 — Room/Lobby System & Map Themes

### Overview
Enables multiple concurrent game instances through a full room system, and adds visual variety with selectable map themes. Migrates from raw `ws` to Socket.io for room-based broadcast isolation.

### New Features

1. **Socket.io Migration** (server-side)
   - Replace raw `ws` library with `socket.io` on the server
   - Replace native `WebSocket` with `socket.io-client` on the client
   - Server still uses port 9998, client connects to same endpoint
   - All existing protocol messages adapted to work over Socket.io events

2. **Room Manager** (server-side data model + logic)
   - `server/roomManager.js` — class that manages all room instances
   - Each room has: `id`, `name`, `maxPlayers`, `themeId`, `state` (waiting/playing/ended), isolated game state
   - Room game state: own `cells[]`, `players Map`, `bombs[]`, `items[]`, `roundState`, ID generators
   - Complete isolation: bombs in room A never affect room B
   - Room lifecycle: created → waiting → playing → rounds loop
   - Rooms stored in memory (Map); room list persisted to `.db/rooms.json`

3. **REST API** (server-side HTTP endpoints)
   - `GET /api/rooms` — list all rooms (id, name, playerCount, maxPlayers, status, themeId)
   - `POST /api/rooms` — create new room (body: `{ name, maxPlayers, themeId }`)
   - Added to the existing HTTP server in `http_server.js` (or integrated into Socket.io's HTTP server)

4. **Room Lobby UI** (client-side)
   - After nickname/skin selection, show room browser screen instead of connecting directly
   - Room list: cards showing room name, player count (e.g., "3/8"), status badge, theme icon
   - "Create Room" button opens a form: room name input, player limit slider (2–8), theme selector (default/winter/moon/random)
   - "Join" button on each room card
   - Auto-refresh room list every 3 seconds via `GET /api/rooms`
   - Replaces the non-functional "Room: EU1" placeholder in the chat panel

5. **Waiting Room Screen** (client-side)
   - Shown after joining a room, before round starts
   - Displays room name, connected player list with skins, player count
   - "Start Game" button (visible to room creator when ≥2 players)
   - Auto-start when max players reached

6. **Socket.io Room Isolation** (server-side)
   - Each room = a Socket.io room (`room:<roomId>`)
   - All broadcasts scoped to room: `io.to('room:' + roomId).emit(...)` instead of global broadcast
   - Player joins Socket.io room on room join, leaves on disconnect/room leave
   - All game tick processing scoped per-room

7. **Map Theme System** (server + client)
   - Three themes: `default` (assets/maps/1.png), `winter` (assets/maps/1-winter.png), `moon` (assets/maps/tileset-moon.png)
   - Theme configurable per room at creation, or `random` (selected at round start)
   - Server broadcasts theme ID to clients when they join: new protocol message `TH{themeId}`
   - Client uses theme ID to load correct tileset in fosfo0 and world rendering
   - Theme-aware `WC` cell update messages use correct tileset path

### Protocol Additions (Sprint 3)
| Code | Direction | Format | Purpose |
|------|-----------|--------|---------|
| `TH` | server→client | `TH{themeId}` | Active theme for current room (default/winter/moon) |
| `RJ` | server→client | `RJ{roomId}\|{roomName}` | Room join confirmation |
| `RL` | server→client | `RL{playerId}\|{nickname}\|{skinId};...` | Room player list update |

### REST API Endpoints
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/rooms` | — | `[{ id, name, playerCount, maxPlayers, status, themeId }]` |
| POST | `/api/rooms` | `{ name, maxPlayers, themeId }` | `{ id, name, maxPlayers, themeId, status }` |

### New Files
| File | Purpose |
|------|---------|
| `server/roomManager.js` | Room class + RoomManager: isolated game state per room |
| `js/rooms.js` | Client-side room browser, create room form, waiting room |
| `css/rooms.css` | Styles for room browser, create form, waiting room |
| `.db/rooms.json` | Persisted room data |

### Modified Files
| File | Changes |
|------|---------|
| `server.js` | Refactor from global state to room-based state; replace ws with socket.io; add room join/leave/create handlers; scope game tick per room |
| `http_server.js` | Add `/api/rooms` GET and POST endpoints, or merge HTTP into socket.io server |
| `package.json` | Add `socket.io` dependency |
| `index.html` | Add room browser HTML, waiting room HTML, link rooms.css and rooms.js |
| `js/aks.js` | Replace native WebSocket with socket.io-client; handle TH, RJ, RL messages; scope connection to room |
| `js/globals.js` | Add room-related globals (currentRoomId, currentTheme, roomPlayers) |
| `js/lobby.js` | PLAY button now navigates to room browser instead of directly connecting |
| `js/initworld.js` | Use dynamic tileset path based on active theme instead of hardcoded `assets/maps/1.png` |
| `js/world/world.js` | Accept tileset path parameter; use it in `loadWorld()` and cell rendering |

### Architecture Notes
- Socket.io replaces raw `ws` — provides built-in rooms, namespaces, and reconnection
- All game state (cells, players, bombs, items, roundState) moves from global variables into Room instances
- Each Room runs its own game tick interval
- Room manager handles room lifecycle (create, join, leave, destroy when empty)
- Theme ID is a string: "default", "winter", or "moon" — maps to tileset file paths
- Client loads socket.io-client from CDN or served via node_modules

---

## Sprint 4 — Mobile Support, UX Polish & Accessibility

### Overview
Makes the game playable on mobile/touch devices, improves chat usability, adds visual feedback for combat events, and establishes baseline accessibility. All changes are client-side only — no server-side modifications needed.

### New Features

1. **Virtual D-Pad & Bomb Button (Touch Controls)**
   - On-screen overlay with directional D-pad (up/down/left/right) and bomb button
   - Only rendered on touch-capable devices (`'ontouchstart' in window` or `navigator.maxTouchPoints > 0`)
   - Touch events map to the same `KD`/`KU` key codes as keyboard input (arrows: 37/38/39/40, space: 32)
   - Multi-touch support: hold direction + tap bomb simultaneously
   - Extends existing mouse handler stubs in `js/events.js`
   - New file: `js/touch-controls.js` for control logic
   - New file: `css/touch-controls.css` for overlay styling
   - Controls positioned bottom-left (D-pad) and bottom-right (bomb button), semi-transparent

2. **Explosion/Death Visual Feedback**
   - When local player is caught in explosion or killed (`PK` message):
     - Semi-transparent red overlay flash (~300ms) over the game viewport
     - Subtle canvas shake effect (CSS transform translate jitter, 200-300ms)
   - Implemented in `js/hud.js` by extending `showDeathNotice()` and adding new `showExplosionFeedback()` method
   - Red flash overlay added as a div inside `#viewport`
   - CSS animations in `css/hud.css`

3. **Chat Message Cap**
   - Cap chat `#listChat` at ~100 `<li>` elements (excluding `#endchat` sentinel)
   - On each `addmessagetochat()` and `addKillToChat()` call, prune oldest messages when count exceeds 100
   - Modified file: `js/chat.js`

4. **Chat Auto-Scroll with Manual Override**
   - Auto-scroll to bottom on new message (already partially implemented)
   - Detect when user manually scrolls up → pause auto-scroll
   - Resume auto-scroll when user scrolls back to bottom (within ~5px threshold)
   - Scroll state tracked via `scroll` event listener on `#listChat`
   - Modified files: `js/chat.js`, `js/aks.js` (for `addKillToChat`)

5. **Chat Filter Buttons**
   - Five filter buttons already exist in HTML: text, text, kill, mod, common + "CHAT" (filter-all)
   - Implement toggle logic: clicking a filter shows/hides messages of that category
   - Message categories identified by CSS class: `.kill-info` for kill feed, default for player chat
   - Active filter state stored in a global; `filter-all` shows everything
   - Each `<li>` gets a `data-category` attribute on creation: `"chat"`, `"kill"`, `"mod"`, `"common"`
   - Filter toggle adds/removes `.selected` class (already styled in CSS) and shows/hides matching `<li>` elements
   - New file: `js/chat-filters.js`

6. **Baseline Accessibility**
   - `lang="en"` on `<html>` — already present ✓
   - `role="application"` on `#viewport` div
   - `aria-label="Game chat input"` on `#msgText` textarea
   - `aria-live="polite"` on `#listChat` chat message list
   - `aria-label="Game world"` on `#layer0` and `#layer1` canvas elements
   - Ensure all interactive buttons have accessible labels (lobby, room browser, chat filters)
   - Modified file: `index.html`

### New Files
| File | Purpose |
|------|---------|
| `js/touch-controls.js` | Virtual D-pad and bomb button overlay for touch devices |
| `css/touch-controls.css` | Styling for touch control overlays |
| `js/chat-filters.js` | Chat filter button logic and message category management |

### Modified Files
| File | Changes |
|------|---------|
| `index.html` | Add ARIA attributes, link new CSS/JS files, add touch controls container, add explosion flash overlay div |
| `js/events.js` | Integrate touch control initialization, extend mouse stubs |
| `js/chat.js` | Add message cap (100), smart auto-scroll with manual override |
| `js/aks.js` | Update `addKillToChat()` to use data-category attribute, respect auto-scroll |
| `js/hud.js` | Add `showExplosionFeedback()` method with red flash + canvas shake |
| `css/hud.css` | CSS animations for red flash overlay and canvas shake |

### Architecture Notes
- Touch controls are purely client-side — they emit the same `KD`/`KU` socket messages as keyboard
- No server changes needed for any Sprint 4 feature
- Chat filters use DOM visibility toggling (display:none) rather than re-rendering
- Auto-scroll uses `scrollTop + clientHeight >= scrollHeight - threshold` to detect bottom position
- Explosion feedback uses CSS `@keyframes` for flash and `transform: translate()` for shake

---

## Sprint 5 — Persistent Progression, Spectator Mode & Polish Pass

### Overview
Adds cross-session player stats with a JSON file database, spectator mode for rooms, and performs a comprehensive regression/polish pass across all features.

### New Features

1. **Persistent Stats Backend** (server-side)
   - `server/statsManager.js` — StatsManager class that reads/writes `.db/stats.json`
   - Tracks per-nickname: `kills`, `deaths`, `gamesPlayed`, `wins`, `winRate`
   - Stats persisted on every round end via `Room.endRound()` calling `statsManager.recordRoundResults()`
   - Data keyed by lowercase nickname for case-insensitive lookups

2. **Stats REST API** (server-side HTTP endpoints)
   - `GET /api/stats/:nickname` — returns individual player stats `{ nickname, kills, deaths, gamesPlayed, wins, winRate }`
   - `GET /api/leaderboard` — returns top players sorted by wins (limit=20), `[{ nickname, kills, deaths, gamesPlayed, wins, winRate }]`
   - Added to the HTTP request handler in `server.js`

3. **Player Stats Overlay** (client-side)
   - In-game overlay toggled by a "Stats" button in the HUD area
   - Fetches from `GET /api/stats/:nickname` for current player
   - Displays kills, deaths, games played, win rate
   - Reuses existing `.page-profile .player-statistics` CSS from `styles.css`
   - New file: `js/stats-overlay.js`
   - New HTML overlay added to `index.html`

4. **Spectator Mode** (server + client)
   - Players can join a room as spectator instead of active player
   - Server: spectators added to Socket.io room but NOT to `room.players` Map — no player entity created
   - Spectators stored in `room.spectators` Set (socketId set)
   - Spectators receive all game broadcasts (world state, player positions, bombs, explosions, kill feed, round events)
   - Spectators cannot send `KD`/`KU`/bomb input — `processMessage()` skips input for spectator connections
   - Client: "Watch" button on room cards in room browser
   - Client: `isSpectating = true` from connection start, no player entity rendered for self
   - Protocol: `joinRoom` event extended with `{ roomId, spectator: true }` option

5. **Regression & Polish Pass** (client + server)
   - Verify nickname persistence across reconnects
   - Test power-up edge cases (rapid collection, stacking)
   - Confirm room isolation (bombs/state in one room must not affect another)
   - Test mobile touch controls on various screen sizes
   - Verify round transitions under various player counts (0, 1, 2, max)
   - Address visual inconsistencies in HUD elements
   - Ensure loading screen covers all asset paths
   - Confirm all dead UI has been implemented or removed
   - Fix bugs and rough edges

### New Files
| File | Purpose |
|------|---------|
| `server/statsManager.js` | StatsManager class — JSON file DB for persistent player stats |
| `js/stats-overlay.js` | Client stats overlay — fetch + display player profile |
| `.db/stats.json` | Persistent player stats database (auto-created) |

### Modified Files
| File | Changes |
|------|---------|
| `server.js` | Add `/api/stats/:nickname` and `/api/leaderboard` endpoints; instantiate StatsManager; pass to RoomManager |
| `server/roomManager.js` | Call `statsManager.recordRoundResults()` in `endRound()`; add `spectators` Set; handle spectator join/leave; skip input processing for spectators |
| `index.html` | Add stats overlay HTML, stats button in HUD, link `js/stats-overlay.js`; add "Watch" button support |
| `js/aks.js` | Handle spectator join flow; suppress input sending when `isSpectating` from connection start |
| `js/rooms.js` | Add "Watch" button to room cards; send `{ roomId, spectator: true }` for spectator joins |
| `js/globals.js` | Add `isFullSpectator` flag (spectator from join, not from death) |
| `js/hud.js` | Add spectator mode indicator in HUD |
| `js/events.js` | Block keyboard input when `isFullSpectator` |
| `css/hud.css` | Stats overlay positioning/styling, spectator badge styles |

### REST API Endpoints (New)
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/stats/:nickname` | `{ nickname, kills, deaths, gamesPlayed, wins, winRate }` |
| GET | `/api/leaderboard` | `[{ nickname, kills, deaths, gamesPlayed, wins, winRate, rank }]` |

### Architecture Notes
- Stats are keyed by lowercase nickname — e.g. `"player1"` and `"Player1"` merge into same record
- StatsManager reads/writes `.db/stats.json` synchronously on updates (acceptable for small-scale JSON DB)
- Spectator connections join Socket.io room for broadcasts but have no player entity — minimal server change
- `room.processMessage()` checks if socketId is in `room.spectators` and returns early (no input processing)
- Stats overlay reuses `.page-profile .player-statistics` CSS already defined in `styles.css`
- The existing `isSpectating` global (set on death) is separate from `isFullSpectator` (set on spectator join)
