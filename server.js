const http = require('http');
const { Server } = require('socket.io');
const { RoomManager, MIN_PLAYERS_TO_START } = require('./server/roomManager');

// ─── Configuration ───────────────────────────────────────────────────────────
const PORT = 9998;

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bomber Socket.io Server\n');
});

// ─── Socket.io Server ────────────────────────────────────────────────────────
const io = new Server(server, {
  path: '/echo',
  cors: { origin: '*' }
});

const roomManager = new RoomManager(io);

// ─── Helper: broadcast room player list ──────────────────────────────────────
function broadcastRoomPlayerList(room) {
  // Format: RL{p1Id}|{p1Nick}|{p1SkinId};{p2Id}|{p2Nick}|{p2SkinId};...
  const entries = [];
  for (const [, p] of room.players) {
    entries.push(p.id + '|' + p.nickname + '|' + (p.skinId || 0));
  }
  const message = 'RL' + entries.join(';');
  io.to('room:' + room.id).emit('game', message);
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
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.players.size >= room.maxPlayers) {
      socket.emit('error', 'Room is full');
      return;
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

    // Send theme
    socket.emit('game', 'TH' + room.activeTheme);

    // Send room player list to all in room
    broadcastRoomPlayerList(room);

    // Start tick if first player
    if (!room.tickInterval) room.startTick();
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
    room.state = 'playing';

    // Send world load to all players in room
    for (const [sid, p] of room.players) {
      const s = io.sockets.sockets.get(sid);
      if (s) room.handleWorldLoad(p, s);
    }
    // Then entities
    for (const [sid, p] of room.players) {
      const s = io.sockets.sockets.get(sid);
      if (s) room.handleWorldEntities(p, s);
    }
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

    // Check if round should end
    if (room.roundState.state === 'active') {
      room.checkRoundEnd();
    }

    // Destroy room if empty
    if (room.players.size === 0) {
      room.stopTick();
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
  console.log(`Bomber Socket.io server running on port ${PORT}`);
  console.log(`Socket.io endpoint: http://localhost:${PORT}/echo`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\nShutting down...');

  // Stop all room ticks and clear all timers
  for (const [, room] of roomManager.rooms) {
    room.stopTick();
    if (room.roundState.timer) clearTimeout(room.roundState.timer);
    if (room.roundState.timeInterval) clearInterval(room.roundState.timeInterval);
    for (const b of room.bombs) {
      if (b.timer) clearTimeout(b.timer);
    }
    for (const item of room.items) {
      if (item.timer) clearTimeout(item.timer);
    }
  }

  io.close();
  server.close();
  process.exit(0);
});
