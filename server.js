const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { RoomManager, MIN_PLAYERS_TO_START } = require('./server/roomManager');

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = 9998;
const ROOT = __dirname;

// ─── MIME Types for static file serving ──────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.wav':  'audio/wav',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── HTTP Server (API + Static Files) ────────────────────────────────────────
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // ─── CORS Preflight ─────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ─── API: GET /api/rooms ────────────────────────────────────────────────
  if (urlPath === '/api/rooms' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
    const rooms = roomManager.listRooms();
    res.end(JSON.stringify(rooms));
    return;
  }

  // ─── API: POST /api/rooms ───────────────────────────────────────────────
  if (urlPath === '/api/rooms' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, maxPlayers, themeId } = JSON.parse(body);

        // Validate name
        if (!name || name.trim().length === 0 || name.length > 20) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
          res.end(JSON.stringify({ error: 'Room name required (1-20 chars)' }));
          return;
        }

        // Validate maxPlayers
        const max = parseInt(maxPlayers) || 4;
        if (max < 2 || max > 8) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
          res.end(JSON.stringify({ error: 'Max players must be 2-8' }));
          return;
        }

        // Validate theme
        const validThemes = ['default', 'winter', 'moon', 'random'];
        const theme = validThemes.includes(themeId) ? themeId : 'random';

        // Create room (creatorId set to null, will be set on first socket join)
        const room = roomManager.createRoom(name.trim(), max, theme, null);
        res.writeHead(201, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({
          id: room.id,
          name: room.name,
          maxPlayers: room.maxPlayers,
          themeId: room.themeId,
          status: room.state,
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // ─── Static File Serving ────────────────────────────────────────────────
  let filePath = urlPath;
  if (filePath === '/') filePath = '/index.html';

  const fullPath = path.join(ROOT, filePath);

  // Security: prevent directory traversal
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found: ' + filePath);
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

// ─── Socket.io Server ────────────────────────────────────────────────────────
const io = new Server(server, {
  path: '/echo',
  cors: { origin: '*' }
});

const roomManager = new RoomManager(io);

// ─── Helper: broadcast room player list ──────────────────────────────────────
function broadcastRoomPlayerList(room) {
  const playerList = [];
  for (const [, p] of room.players) {
    playerList.push({ id: p.id, nickname: p.nickname, skinId: p.skinId || 0 });
  }
  io.to('room:' + room.id).emit('roomPlayerList', playerList);
}

// ─── Socket.io Connection Handler ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle nickname init
  socket.on('nicknameInit', (data) => {
    socket.nickname = data.nickname;
    socket.skinId = data.skinId;
  });

  // Handle room join
  socket.on('joinRoom', (roomId) => {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('roomError', 'Room not found');
      return;
    }
    if (room.players.size >= room.maxPlayers) {
      socket.emit('roomError', 'Room is full');
      return;
    }

    // Leave previous room if any
    if (socket.currentRoomId && socket.currentRoomId !== roomId) {
      handleLeaveRoom(socket);
    }

    socket.join('room:' + roomId);
    socket.currentRoomId = roomId;

    const player = room.createPlayer(socket);

    // Apply nickname/skin from nicknameInit if set
    if (socket.nickname) {
      let nick = socket.nickname.trim();
      if (nick.length > 16) nick = nick.substring(0, 16);
      if (nick.length === 0) nick = 'Player';
      player.nickname = nick;
    }
    if (socket.skinId !== undefined) {
      const skinId = parseInt(socket.skinId, 10);
      if (!isNaN(skinId) && skinId >= 0 && skinId <= 23) {
        player.skin = skinId;
        player.skinId = skinId;
      }
    }

    room.players.set(socket.id, player);

    // Set creator if first player and no creator set
    if (!room.creatorId) {
      room.creatorId = socket.id;
    }

    // Confirm join
    socket.emit('roomJoined', {
      roomId: room.id,
      roomName: room.name,
      isCreator: room.creatorId === socket.id
    });

    // Send theme
    socket.emit('game', 'TH' + room.activeTheme);

    // Send room player list to all in room
    broadcastRoomPlayerList(room);

    // Start tick if first player
    if (!room.tickInterval) room.startTick();

    // If room is already playing (late join / rejoin), send world data immediately
    if (room.state === 'playing') {
      room.handleWorldLoad(player, socket);
      setTimeout(() => {
        room.handleWorldEntities(player, socket);
      }, 100);
    }
  });

  // Handle game messages (same protocol as before, using ^ separator)
  socket.on('game', (message) => {
    const roomId = socket.currentRoomId;
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    // Protocol uses ^ as packet separator
    const packets = message.split('^');
    for (const packet of packets) {
      if (packet.length > 0) {
        room.processMessage(socket, player, packet);
      }
    }
  });

  // Handle startGame from room creator
  socket.on('startGame', () => {
    const room = roomManager.getRoom(socket.currentRoomId);
    if (!room) return;
    if (room.creatorId !== socket.id) return; // only creator can start
    if (room.players.size < MIN_PLAYERS_TO_START) return;
    if (room.state === 'playing') return; // already playing

    room.state = 'playing';
    room.initializeMap();
    room.startTick();

    // Broadcast game start to all players in room
    io.to('room:' + room.id).emit('gameStart');

    // Send world data to each player
    for (const [sid, p] of room.players) {
      const s = io.sockets.sockets.get(sid);
      if (s) room.handleWorldLoad(p, s);
    }
    // Then entities (short delay for world load)
    setTimeout(() => {
      for (const [sid, p] of room.players) {
        const s = io.sockets.sockets.get(sid);
        if (s) room.handleWorldEntities(p, s);
      }
    }, 100);
  });

  // Handle room leave
  socket.on('leaveRoom', () => {
    handleLeaveRoom(socket);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    handleLeaveRoom(socket);
  });
});

// ─── Leave Room Helper ───────────────────────────────────────────────────────
function handleLeaveRoom(socket) {
  const roomId = socket.currentRoomId;
  if (!roomId) return;

  const room = roomManager.getRoom(roomId);
  if (!room) {
    socket.currentRoomId = null;
    return;
  }

  const player = room.players.get(socket.id);
  if (player) {
    // Broadcast player disconnect to room
    room.broadcastAll('PD' + player.id);
    room.players.delete(socket.id);

    // Transfer creator if creator left
    if (room.creatorId === socket.id) {
      const firstPlayer = room.players.keys().next().value;
      room.creatorId = firstPlayer || null;
      if (firstPlayer) {
        const creatorSocket = io.sockets.sockets.get(firstPlayer);
        if (creatorSocket) {
          creatorSocket.emit('roomCreatorTransfer');
        }
      }
    }

    // Check if round should end
    if (room.state === 'playing' && room.roundState.state === 'active') {
      room.checkRoundEnd();
    }

    // Destroy room if empty
    if (room.players.size === 0) {
      room.cleanup();
      roomManager.removeRoom(roomId);
      console.log('Room ' + roomId + ' destroyed (empty)');
    } else {
      // Update player list for remaining players
      broadcastRoomPlayerList(room);
    }
  }

  socket.leave('room:' + roomId);
  socket.currentRoomId = null;
}

// ─── Start Server ────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Bomber server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`Socket.io endpoint: http://localhost:${PORT}/echo`);
  console.log(`API: GET/POST http://localhost:${PORT}/api/rooms`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\nShutting down...');

  // Stop all room ticks and clear all timers
  for (const [, room] of roomManager.rooms) {
    room.cleanup();
  }

  io.close();
  server.close();
  process.exit(0);
});
