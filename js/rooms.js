// ─── Room Join & Waiting Room UI ─────────────────────────────────────────────
var RoomUI = (function() {
  var THEME_ICONS = {
    'random': '🎲',
    'default': '🌿',
    'winter': '❄️',
    'moon': '🌙'
  };

  function init() {
    // Leave room button
    var leaveBtn = document.getElementById('leave-room-btn');
    if (leaveBtn) leaveBtn.addEventListener('click', leaveRoom);
  }

  function joinRoom(roomId) {
    currentRoomId = roomId;

    // One-time listener for roomJoined to transition to waiting room
    var onRoomJoined = function(data) {
      showWaitingRoom(data.roomName, data.themeId || currentTheme);
      updateChatRoomLabel(data.roomName || 'Room');
      socket.off('roomJoined', onRoomJoined);
    };

    // Connect socket if not connected, then join room
    if (!socket || !socket.connected) {
      InitializeSocket();
      // Socket created by InitializeSocket, attach listener now
      // aks.js connect handler will emit joinRoom with currentRoomId
      socket.on('roomJoined', onRoomJoined);
    } else {
      socket.on('roomJoined', onRoomJoined);
      socket.emit('joinRoom', roomId);
    }
  }

  function showWaitingRoom(roomName, themeId) {
    var waitingRoom = document.getElementById('waiting-room');
    if (waitingRoom) waitingRoom.style.display = '';

    var title = document.getElementById('waiting-room-title');
    if (title) title.textContent = roomName || 'Room';

    var themeEl = document.getElementById('waiting-room-theme');
    if (themeEl) {
      var icon = THEME_ICONS[themeId] || THEME_ICONS['default'];
      themeEl.textContent = icon + ' ' + (themeId || 'default');
    }

    currentRoomName = roomName || '';
  }

  function hideWaitingRoom() {
    var waitingRoom = document.getElementById('waiting-room');
    if (waitingRoom) waitingRoom.style.display = 'none';
  }

  function updateWaitingRoom(playerList) {
    var container = document.getElementById('waiting-room-players');
    if (!container) return;

    container.innerHTML = '';

    for (var i = 0; i < playerList.length; i++) {
      var p = playerList[i];
      var card = document.createElement('div');
      card.className = 'waiting-player-card';

      var canvas = document.createElement('canvas');
      canvas.className = 'waiting-player-skin';
      canvas.width = 32;
      canvas.height = 32;
      card.appendChild(canvas);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'waiting-player-name';
      nameSpan.textContent = p.nickname || 'Player';
      card.appendChild(nameSpan);

      container.appendChild(card);

      // Load skin preview
      loadSkinPreview(canvas, p.skinId || 0);
    }

    // Update status
    var status = document.getElementById('waiting-room-status');
    if (status) {
      status.textContent = playerList.length + ' players in room';
    }
  }

  function loadSkinPreview(canvas, skinId) {
    var SPRITE_COLS = 4;
    var SPRITE_ROWS = 4;
    var PREVIEW_FRAME = 8;

    var img = new Image();
    img.onload = function() {
      var ctx = canvas.getContext('2d');
      var frameW = img.width / SPRITE_COLS;
      var frameH = img.height / SPRITE_ROWS;
      var frameCol = PREVIEW_FRAME % SPRITE_COLS;
      var frameRow = Math.floor(PREVIEW_FRAME / SPRITE_COLS);
      var sx = frameCol * frameW;
      var sy = frameRow * frameH;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, canvas.width, canvas.height);
    };
    img.src = 'assets/characters/' + skinId + '.png';
  }

  function updateChatRoomLabel(roomName) {
    var label = document.getElementById('chat-room-label');
    if (label) label.textContent = roomName;
    var title = document.getElementById('chat-room-name');
    if (title) title.textContent = roomName;
  }

  function joinRoomAsSpectator(roomId) {
    currentRoomId = roomId;
    isFullSpectator = true;
    isSpectating = true;

    var onRoomJoined = function(data) {
      // Skip waiting room — go straight to game if room is playing
      if (data.spectator && data.status === 'playing') {
        document.getElementById('chat').style.display = '';
        if (typeof initChatScroll === 'function') initChatScroll();
        if (typeof HUD !== 'undefined' && HUD.setRoomInfo) {
          HUD.setRoomInfo(data.roomName || '', data.themeId || 'default');
        }
        if (typeof fosfo0 === 'undefined' || !fosfo0) initCanvas();
        LoadingManager.show();
        LoadingManager.setTotal(6);
        loadGameAssets(function() {
          LoadingManager.setStatus('Loading world...');
          sendSocketMessage('WL');
          initWorld();
          // Show spectator badge after world loads
          if (typeof HUD !== 'undefined' && HUD.showSpectatorBadge) {
            HUD.showSpectatorBadge();
          }
          // Show stats button during gameplay
          if (typeof StatsOverlay !== 'undefined' && StatsOverlay.showButton) StatsOverlay.showButton();
        });
      } else {
        // Room is in waiting state — show waiting room like normal join
        showWaitingRoom(data.roomName, data.themeId || currentTheme);
        updateChatRoomLabel(data.roomName || 'Room');
      }
      socket.off('roomJoined', onRoomJoined);
    };

    if (!socket || !socket.connected) {
      InitializeSocket();
      socket.on('roomJoined', onRoomJoined);
    } else {
      socket.on('roomJoined', onRoomJoined);
      socket.emit('joinRoom', { roomId: roomId, spectator: true });
    }
  }

  function leaveRoom() {
    if (socket && socket.connected) {
      socket.emit('leaveRoom');
    }

    // Clear client-side game state to prevent stale data leaking into next room
    if (typeof world !== 'undefined' && world) {
      // Remove all player sprites
      if (world.players && typeof fosfo1 !== 'undefined' && fosfo1) {
        for (var i = 0; i < world.players.length; i++) {
          if (world.players[i]) fosfo1.undraw('player' + world.players[i].id);
        }
      }
      // Remove all bomb sprites
      if (world.bombs && typeof fosfo1 !== 'undefined' && fosfo1) {
        for (var i = 0; i < world.bombs.length; i++) {
          if (world.bombs[i]) fosfo1.undraw('bomb' + world.bombs[i].id);
        }
      }
      // Remove all item sprites
      if (world.items && typeof fosfo1 !== 'undefined' && fosfo1) {
        for (var i = 0; i < world.items.length; i++) {
          if (world.items[i]) fosfo1.undraw('item' + world.items[i].id);
        }
      }
      world.players = [];
      world.bombs = [];
      world.items = [];
    }
    currentPlayer = null;

    // Reset round/scoreboard/kill state
    roundState = 'waiting';
    roundTimeRemaining = 0;
    roundWinner = null;
    roundResults = [];
    scoreboardData = [];
    killFeed = [];

    // Reset room globals
    currentRoomId = null;
    currentRoomName = '';
    isRoomCreator = false;
    isFullSpectator = false;
    isSpectating = false;
    roomPlayerList = [];
    updateChatRoomLabel('---');

    // Hide HUD elements
    if (typeof HUD !== 'undefined') {
      if (HUD.hideRoomInfo) HUD.hideRoomInfo();
      if (HUD.hideResults) HUD.hideResults();
      if (HUD.hideDeathNotice) HUD.hideDeathNotice();
    }
    // Hide stats button when leaving gameplay
    if (typeof StatsOverlay !== 'undefined' && StatsOverlay.hideButton) StatsOverlay.hideButton();

    hideWaitingRoom();

    // Return to lobby screen
    document.getElementById('lobby-screen').style.display = '';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init: init,
    joinRoom: joinRoom,
    showWaitingRoom: showWaitingRoom,
    hideWaitingRoom: hideWaitingRoom,
    updateWaitingRoom: updateWaitingRoom,
    updateChatRoomLabel: updateChatRoomLabel,
    joinRoomAsSpectator: joinRoomAsSpectator
  };
})();
