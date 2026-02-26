function broadcast(io, message) {
  io.emit('msg', message);
}

function sendTo(socket, message) {
  socket.emit('msg', message);
}

module.exports = { broadcast, sendTo };
