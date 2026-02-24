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
