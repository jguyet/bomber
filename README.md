# Game of Bombs

Multiplayer Bomberman online game built with Node.js, WebSockets, and the [Fosfo](https://github.com/jguyet/fosfo) 2D canvas engine.

<img src="./1.gif"/>

## Features

- **Real-time multiplayer** — WebSocket-based server running at 60 ticks/sec with authoritative movement
- **Pre-game lobby** — Pick a nickname and choose from 24 character skins before joining
- **Bomb system** — Place bombs, destroy walls, chain explosions, and collect power-ups (extra bombs, range, speed)
- **In-game chat** — Send messages with actual player nicknames, XSS-safe
- **Loading overlay** — Animated progress bar tracking asset loading with per-asset feedback
- **Connection status** — Auto-reconnect with retry counter and permanent-failure state
- **Responsive design** — Lobby adapts from desktop (6 columns) to tablet (4) to mobile (3) with glassmorphism styling
- **SEO / Open Graph** — Proper meta tags, favicon, and social sharing cards

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server (game) | Node.js + [ws](https://github.com/websockets/ws) on port **9998** |
| Server (static) | Node.js HTTP on port **8060** |
| Client engine | Fosfo (custom 2D dual-layer canvas) |
| Client libs | jQuery 1.9, Lodash |
| Styling | Vanilla CSS (no framework) |
| Protocol | Custom text-based — `^`-separated packets, 2-char prefix (`type` + `action`) |

## Quick Start

```bash
# Install dependencies
npm install

# Start both servers (WebSocket + HTTP)
npm start
```

Open [http://localhost:8060](http://localhost:8060) in your browser.

## Development

```bash
# Start in dev mode (identical to production for this project)
npm run dev

# Or use the Makefile
make install
make dev
```

## Docker

```bash
# Build image
make docker-build

# Run container (exposes ports 9998 + 8060)
make docker-run

# Tail logs
make docker-logs

# Stop
make docker-stop
```

Or manually:

```bash
docker build -t bomber:latest .
docker run -d --name bomber -p 9998:9998 -p 8060:8060 bomber:latest
```

## Environment Variables

See `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_PORT` | `9998` | WebSocket game server port |
| `HTTP_PORT` | `8060` | Static file server port |
| `NODE_ENV` | `production` | Node environment |

## Project Structure

```
bomber/
  server.js            # WebSocket game server (authoritative, 60 tick)
  http_server.js       # Static file server
  index.html           # Main HTML (lobby + game + overlays)
  package.json         # Node.js project config
  Dockerfile           # Multi-stage Docker build (node:20-alpine)
  Makefile             # Dev/build/docker shortcuts
  css/
    styles.css         # Game + chat styles
    lobby.css          # Lobby screen styles
    loading.css        # Loading overlay styles
    connection-status.css  # Connection overlay styles
    normalize-2.1.0.css    # CSS reset
  js/
    lobby.js           # Pre-connect lobby (nickname + skin selection)
    loading.js         # Loading overlay manager
    connection-status.js   # Disconnect/reconnect overlay
    aks.js             # WebSocket client + reconnect logic
    chat.js            # In-game chat
    events.js          # Keyboard input handling
    globals.js         # Shared global state
    initworld.js       # World initialization + rendering
    canvas/fosfo.js    # Fosfo 2D engine
    player/player.js   # Player entity
    bomb/bomb.js       # Bomb entity
    item/item.js       # Item entity
    world/world.js     # World/map logic
  assets/
    characters/        # 24 character sprite sheets (0-23.png)
    bombs/             # Bomb + explosion sprites
    maps/              # Map tile assets
    favicon.svg        # Site favicon
    og-image.png       # Open Graph share image
  scripts/
    start.sh           # Bash start script
    start.ps1          # PowerShell start script
```

## Game Protocol

Packets are `^`-separated, each with a 2-character prefix:

| Prefix | Direction | Description |
|--------|-----------|-------------|
| `KD` | Client -> Server | Key down (keyCode) |
| `KU` | Client -> Server | Key up (keyCode) |
| `NI` | Client -> Server | Nickname init (`nickname\|skinId`) |
| `MN` | Bidirectional | Chat message (`nickname\|text`) |
| `WL` | Server -> Client | World load (map dimensions + cell data) |
| `WE` | Client -> Server | Request world entities |
| `WC` | Server -> Client | Cell update (wall destroyed) |
| `PA` | Server -> Client | Player add/join |
| `PM` | Server -> Client | Player move |
| `PS` | Server -> Client | Player stop |
| `PD` | Server -> Client | Player disconnect |
| `BA` | Server -> Client | Bomb added |
| `BE` | Server -> Client | Bomb exploded |
| `IA` | Server -> Client | Item spawned |
| `ID` | Server -> Client | Item despawned/picked up |
| `IS` | Server -> Client | Item stat change (speed) |

## Controls

| Key | Action |
|-----|--------|
| `W` / `Arrow Up` | Move up |
| `S` / `Arrow Down` | Move down |
| `A` / `Arrow Left` | Move left |
| `D` / `Arrow Right` | Move right |
| `Space` | Place bomb |
| `Enter` | Send chat message |

## Requirements

- Node.js >= 18.0.0
- npm

## License

MIT
