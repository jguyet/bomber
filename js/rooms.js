// ─── Room Browser & Waiting Room UI ─────────────────────────────────────────
var RoomUI = (function() {
  var refreshInterval = null;

  var THEME_ICONS = {
    'random': '🎲',
    'default': '🌿',
    'winter': '❄️',
    'moon': '🌙'
  };

  function init() {
    // Create Room button
    var createBtn = document.getElementById('create-room-btn');
    if (createBtn) createBtn.addEventListener('click', showCreateModal);

    // Refresh button
    var refreshBtn = document.getElementById('refresh-rooms-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchRooms);

    // Create Room modal buttons
    var confirmBtn = document.getElementById('create-room-confirm');
    if (confirmBtn) confirmBtn.addEventListener('click', createRoom);

    var cancelBtn = document.getElementById('create-room-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', hideCreateModal);

    // Max players slider
    var slider = document.getElementById('room-max-players');
    var sliderLabel = document.getElementById('room-max-players-label');
    if (slider && sliderLabel) {
      slider.addEventListener('input', function() {
        sliderLabel.textContent = this.value;
      });
    }

    // Theme selector
    var themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
      themeSelector.addEventListener('click', function(e) {
        var option = e.target.closest('.theme-option');
        if (!option) return;
        var prev = themeSelector.querySelector('.theme-option.selected');
        if (prev) prev.classList.remove('selected');
        option.classList.add('selected');
      });
    }

    // Leave room button
    var leaveBtn = document.getElementById('leave-room-btn');
    if (leaveBtn) leaveBtn.addEventListener('click', leaveRoom);

    // Start game button
    var startBtn = document.getElementById('start-game-btn');
    if (startBtn) startBtn.addEventListener('click', startGame);
  }

  function showBrowser() {
    document.getElementById('room-browser').style.display = '';
    hideWaitingRoom();
    fetchRooms();
    startAutoRefresh();
  }

  function hideBrowser() {
    document.getElementById('room-browser').style.display = 'none';
    stopAutoRefresh();
  }

  function fetchRooms() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/rooms', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          var rooms = JSON.parse(xhr.responseText);
          renderRoomList(rooms);
        } catch (e) {
          console.error('Failed to parse rooms:', e);
        }
      }
    };
    xhr.send();
  }

  function renderRoomList(rooms) {
    var list = document.getElementById('room-list');
    var emptyMsg = document.getElementById('room-list-empty');
    if (!list) return;

    // Remove existing room cards (keep the empty message element)
    var cards = list.querySelectorAll('.room-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].parentNode.removeChild(cards[i]);
    }

    if (!rooms || rooms.length === 0) {
      if (emptyMsg) emptyMsg.style.display = '';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      var card = document.createElement('div');
      card.className = 'room-card';
      card.setAttribute('data-room-id', room.id);

      var playerCount = room.playerCount || 0;
      var maxPlayers = room.maxPlayers || 4;
      var status = room.status || room.state || 'waiting';
      var statusClass = status === 'waiting' ? 'status-waiting' : 'status-playing';
      var statusLabel = status === 'waiting' ? 'Waiting' : 'Playing';
      var themeIcon = THEME_ICONS[room.themeId] || THEME_ICONS['default'];

      card.innerHTML =
        '<div class="room-card-header">' +
          '<span class="room-card-name">' + escapeHtml(room.name) + '</span>' +
          '<span class="room-card-theme">' + themeIcon + '</span>' +
        '</div>' +
        '<div class="room-card-info">' +
          '<span class="room-card-players">' + playerCount + '/' + maxPlayers + ' players</span>' +
          '<span class="room-card-status ' + statusClass + '">' + statusLabel + '</span>' +
        '</div>' +
        '<button class="room-card-join">JOIN</button>';

      list.appendChild(card);

      // Bind join handler
      (function(roomId) {
        card.querySelector('.room-card-join').addEventListener('click', function() {
          joinRoom(roomId);
        });
      })(room.id);
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function joinRoom(roomId) {
    currentRoomId = roomId;
    stopAutoRefresh();

    // One-time listener for roomJoined to transition to waiting room
    var onRoomJoined = function(data) {
      hideBrowser();
      showWaitingRoom(data.roomName, data.themeId || currentTheme);
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

  function showCreateModal() {
    var modal = document.getElementById('create-room-modal');
    if (modal) modal.style.display = '';
    // Default room name
    var nameInput = document.getElementById('room-name-input');
    if (nameInput && !nameInput.value) {
      nameInput.value = (playerNickname || 'Player') + "'s Room";
    }
  }

  function hideCreateModal() {
    var modal = document.getElementById('create-room-modal');
    if (modal) modal.style.display = 'none';
  }

  function createRoom() {
    var nameInput = document.getElementById('room-name-input');
    var maxSlider = document.getElementById('room-max-players');
    var themeSelector = document.getElementById('theme-selector');

    var name = nameInput ? nameInput.value.trim() : 'New Room';
    if (!name || name.length === 0) {
      name = (playerNickname || 'Player') + "'s Room";
    }

    var maxPlayers = maxSlider ? parseInt(maxSlider.value) : 4;

    var selectedTheme = 'random';
    if (themeSelector) {
      var selected = themeSelector.querySelector('.theme-option.selected');
      if (selected) selectedTheme = selected.getAttribute('data-theme');
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/rooms', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            var room = JSON.parse(xhr.responseText);
            hideCreateModal();
            joinRoom(room.id);
          } catch (e) {
            console.error('Failed to parse room response:', e);
          }
        } else {
          try {
            var err = JSON.parse(xhr.responseText);
            alert(err.error || 'Failed to create room');
          } catch (e) {
            alert('Failed to create room');
          }
        }
      }
    };
    xhr.send(JSON.stringify({ name: name, maxPlayers: maxPlayers, themeId: selectedTheme }));
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

    // Show/hide start button based on creator status
    var startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.style.display = isRoomCreator ? '' : 'none';
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
      if (playerList.length < 2) {
        status.textContent = 'Waiting for players... (' + playerList.length + '/2 minimum)';
      } else {
        status.textContent = playerList.length + ' players ready';
      }
    }

    // Show/hide start button (only for creator, only when >= 2 players)
    var startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.style.display = (isRoomCreator && playerList.length >= 2) ? '' : 'none';
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

  function leaveRoom() {
    if (socket && socket.connected) {
      socket.emit('leaveRoom');
    }
    currentRoomId = null;
    currentRoomName = '';
    isRoomCreator = false;
    roomPlayerList = [];
    hideWaitingRoom();
    showBrowser();
  }

  function startGame() {
    if (socket && socket.connected) {
      socket.emit('startGame');
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(fetchRooms, 3000);
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init: init,
    showBrowser: showBrowser,
    hideBrowser: hideBrowser,
    fetchRooms: fetchRooms,
    joinRoom: joinRoom,
    createRoom: createRoom,
    showWaitingRoom: showWaitingRoom,
    hideWaitingRoom: hideWaitingRoom,
    updateWaitingRoom: updateWaitingRoom
  };
})();
