# Game of Bombs

Multiplayer Bomberman online game built with Node.js, Socket.io, and the [Fosfo](https://github.com/jguyet/fosfo) 2D canvas engine. Features a room/lobby system, competitive rounds, map themes, and real-time gameplay at 60 ticks/sec.

<img src="./1.gif"/>

## Features

- **Room system** — Create and join game rooms via a browser UI; each room is fully isolated with its own map, players, bombs, items, and round state
- **Map themes** — Three visual themes (Default, Winter, Moon) selectable per room, plus a Random option that re-rolls each round
- **Real-time multiplayer** — Socket.io-based server running at 60 ticks/sec with authoritative movement and room-scoped broadcasts
- **Pre-game lobby** — Pick a nickname and choose from 24 character skins before browsing rooms
- **Waiting room** — See connected players with skin previews; room creator can start the game when 2+ players are ready
- **Competitive rounds** — 3-minute timed rounds; last player standing or highest kills wins; auto-restart between rounds
- **Kill tracking & scoreboard** — Per-player kills/deaths stats, live HUD scoreboard, kill feed in chat
- **Power-up system** — Destroy walls to spawn BombUp, FireUp, and SpeedUp items; persist until collected or destroyed
- **Round results screen** — Full-screen overlay at round end showing winner, all players' stats, and countdown to next round
- **Dead player spectating** — Killed players become spectators until the next round begins
- **Bomb system** — Place bombs, destroy walls, chain explosions with kill attribution to bomb owner
- **In-game chat** — Messages with player nicknames, room-scoped, plus kill feed entries
- **HUD** — Round timer with urgency states, scoreboard, room name & theme indicator
- **Loading overlay** — Animated progress bar tracking asset loading
- **Connection status** — Auto-reconnect with retry counter and permanent-failure state
- **Late-join sync** — New players receive full game state, round state, and scoreboard on connect
- **Room persistence** — Room ID counter persisted to `.db/rooms.json` across server restarts
- **Persistent stats** — Player stats (kills, deaths, wins, games played, win rate) persisted to `.db/stats.json` across sessions
- **Stats overlay** — In-game player profile with K/D ratio, win rate, and top-20 leaderboard
- **Spectator mode** — "Watch" button on room cards to join as spectator; full game view with blocked input
- **REST API** — `GET/POST /api/rooms` for rooms, `GET /api/stats/:nickname` for player stats, `GET /api/leaderboard` for top players
- **Touch controls** — Virtual D-pad and bomb button overlay for mobile/touch devices; multi-touch support, hidden on desktop
- **Explosion feedback** — Red flash overlay and canvas shake when the local player is caught in an explosion or killed
- **Chat filters** — Toggle buttons to filter chat by category (all, chat, kill, mod, common)
- **Smart chat** — Message cap (100 entries) with auto-scroll that pauses when the user scrolls up
- **Nickname labels** — Improved legibility with badge-style background, polyfill for `roundRect`, and current-player highlight
- **Accessibility** — ARIA roles/labels on canvas, chat input, and chat list; semantic attributes across all interactive elements
- **Responsive design** — Lobby and room browser adapt from desktop to mobile with glassmorphism styling
- **SEO / Open Graph** — Meta tags, favicon, and social sharing cards
- **Docker-ready** — Multi-stage Dockerfile with health check, non-root user, single-port deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js + [Socket.io](https://socket.io) on port **9998** (HTTP + WebSocket + REST API, unified) |
| Client engine | Fosfo (custom 2D dual-layer canvas) |
| Client libs | jQuery 1.9, Lodash, Socket.io client |
| Styling | Vanilla CSS (no framework) |
| Protocol | Custom text-based — `^`-separated packets, 2-char prefix (`type` + `action`) over Socket.io events |
| Persistence | JSON files in `.db/` directory |

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:9998](http://localhost:9998) in your browser.

## Development

```bash
# Start in dev mode
npm run dev

# Or use the Makefile
make install
make dev
```

## Docker

```bash
# Build image
make docker-build

# Run container (exposes port 9998)
make docker-run

# Tail logs
make docker-logs

# Stop
make docker-stop
```

Or manually:

```bash
docker build -t bomber:latest .
docker run -d --name bomber -p 9998:9998 bomber:latest
```

## Environment Variables

See `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `9998` | Unified server port (HTTP + Socket.io + API) |
| `NODE_ENV` | `production` | Node environment |

## Project Structure

```
bomber/
  server.js              # Unified server: Socket.io + REST API + static files (port 9998)
  server/
    roomManager.js       # Room class (isolated game state) + RoomManager
    statsManager.js      # Persistent player stats (JSON file DB)
  index.html             # Main HTML (lobby + room browser + waiting room + game + HUD)
  package.json           # Node.js project config (v3.0.0)
  Dockerfile             # Multi-stage Docker build (node:20-alpine)
  Makefile               # Dev/build/docker shortcuts
  .env.example           # Environment variable template
  css/
    styles.css           # Game + chat styles
    lobby.css            # Lobby screen styles
    rooms.css            # Room browser + waiting room styles
    loading.css          # Loading overlay styles
    connection-status.css  # Connection overlay styles
    hud.css              # HUD: timer, scoreboard, results, room/theme indicator, explosion feedback
    touch-controls.css   # Virtual D-pad + bomb button overlay styling
    normalize-2.1.0.css  # CSS reset
  js/
    lobby.js             # Pre-connect lobby (nickname + skin selection)
    rooms.js             # Room browser UI, create room form, waiting room
    loading.js           # Loading overlay manager
    connection-status.js # Disconnect/reconnect overlay
    hud.js               # HUD: timer, scoreboard, results, room info, death notice, explosion feedback
    stats-overlay.js     # Player stats + leaderboard overlay
    aks.js               # Socket.io client + protocol handler + reconnect
    chat.js              # In-game chat + kill feed + message cap + smart auto-scroll
    chat-filters.js      # Chat filter button logic (all/chat/kill/mod/common)
    touch-controls.js    # Virtual D-pad + bomb button for touch devices
    events.js            # Keyboard input handling + spectator blocking
    globals.js           # Shared global state (room, theme, round, scoreboard)
    initworld.js         # World initialization + theme-aware tileset loading
    canvas/fosfo.js      # Fosfo 2D engine
    player/player.js     # Player entity
    bomb/bomb.js         # Bomb entity
    item/item.js         # Item entity
    world/world.js       # World/map logic + theme-aware rendering
  assets/
    characters/          # 24 character sprite sheets (0-23.png)
    bombs/               # Bomb + explosion sprites
    maps/                # Map tilesets: 1.png (default), 1-winter.png, tileset-moon.png
    favicon.svg          # Site favicon
    og-image.png         # Open Graph share image
  .db/                   # Runtime persistence (rooms.json, stats.json)
  scripts/
    start.sh             # Bash start script
    start.ps1            # PowerShell start script
```

## REST API

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/rooms` | — | `[{ id, name, playerCount, maxPlayers, status, themeId }]` |
| `POST` | `/api/rooms` | `{ name, maxPlayers, themeId }` | `{ id, name, maxPlayers, themeId, status }` |
| `GET` | `/api/stats/:nickname` | — | `{ nickname, kills, deaths, gamesPlayed, wins, winRate }` |
| `GET` | `/api/leaderboard` | — | `[{ nickname, kills, deaths, gamesPlayed, wins, winRate }]` (top 20) |

## Game Protocol

Packets are `^`-separated, each with a 2-character prefix, transmitted over Socket.io `'game'` events:

| Prefix | Direction | Description |
|--------|-----------|-------------|
| `KD` | Client -> Server | Key down (keyCode) |
| `KU` | Client -> Server | Key up (keyCode) |
| `NI` | Client -> Server | Nickname init (`nickname\|skinId`) |
| `MN` | Bidirectional | Chat message (`nickname\|text`) |
| `WL` | Server -> Client | World load (map dimensions + cell data) |
| `WE` | Client -> Server | Request world entities |
| `WC` | Server -> Client | Cell update (wall destroyed) |
| `TH` | Server -> Client | Theme ID (`default\|winter\|moon`) |
| `PA` | Server -> Client | Player add/join |
| `PM` | Server -> Client | Player move |
| `PS` | Server -> Client | Player stop |
| `PD` | Server -> Client | Player disconnect |
| `PK` | Server -> Client | Player killed |
| `BA` | Server -> Client | Bomb added |
| `BE` | Server -> Client | Bomb exploded |
| `IA` | Server -> Client | Item spawned |
| `ID` | Server -> Client | Item despawned/picked up |
| `IS` | Server -> Client | Speed change |
| `RS` | Server -> Client | Round state (`state\|timeRemainingMs`) |
| `RW` | Server -> Client | Round winner |
| `RR` | Server -> Client | Round reset (new map incoming) |
| `RE` | Server -> Client | Round end results |
| `KF` | Server -> Client | Kill feed event |
| `SB` | Server -> Client | Scoreboard update |

### Socket.io Events (non-protocol)

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client -> Server | Join a room by ID |
| `leaveRoom` | Client -> Server | Leave current room |
| `startGame` | Client -> Server | Creator starts the game |
| `nicknameInit` | Client -> Server | Send nickname + skin before joining |
| `roomJoined` | Server -> Client | Room join confirmation (roomId, roomName, isCreator, themeId) |
| `roomPlayerList` | Server -> Client | Updated player list for waiting room |
| `roomCreatorTransfer` | Server -> Client | Notifies new creator when original leaves |
| `roomError` | Server -> Client | Error message (room full, not found) |
| `gameStart` | Server -> Client | Game is starting, initialize canvas |

## Game Flow

1. **Lobby** — Enter nickname, pick a character skin, click PLAY
2. **Room Browser** — Browse existing rooms or create a new one (name, max players, theme)
3. **Waiting Room** — See connected players; creator clicks START when 2+ players ready
4. **Gameplay** — 3-minute competitive rounds with bombs, power-ups, and kills
5. **Round End** — Results screen for 5 seconds, then map regenerates and new round begins
6. **Between Rounds** — Theme re-randomized (if set to Random), all stats reset, players respawn

## Controls

| Key | Action |
|-----|--------|
| `W` / `Arrow Up` | Move up |
| `S` / `Arrow Down` | Move down |
| `A` / `Arrow Left` | Move left |
| `D` / `Arrow Right` | Move right |
| `Space` | Place bomb |
| `Enter` | Send chat message |

On **touch devices**, a virtual D-pad (bottom-left) and bomb button (bottom-right) appear automatically. Multi-touch is supported.

## Requirements

- Node.js >= 18.0.0
- npm

## License

MIT
