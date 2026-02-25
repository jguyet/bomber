// ─── Lobby Screen Logic ──────────────────────────────────────────────────────
(function() {
  var TOTAL_SKINS = 24;
  var SPRITE_COLS = 4;
  var SPRITE_ROWS = 4;
  // Frame index 8 = first frame of "down" animation (row 2, col 0 in a 4x4 grid)
  var PREVIEW_FRAME = 8;

  function initLobby() {
    var skinGrid = document.getElementById('skin-grid');
    var playBtn = document.getElementById('play-btn');
    var nicknameInput = document.getElementById('nickname-input');

    // Restore from localStorage if available
    var savedNickname = localStorage.getItem('bomber_nickname');
    var savedSkinId = localStorage.getItem('bomber_skinId');

    if (savedNickname) {
      playerNickname = savedNickname;
      nicknameInput.value = savedNickname;
    }

    // Default skin selection (use saved or 0)
    playerSkinId = (savedSkinId !== null) ? parseInt(savedSkinId, 10) : 0;
    if (isNaN(playerSkinId) || playerSkinId < 0 || playerSkinId >= TOTAL_SKINS) {
      playerSkinId = 0;
    }

    // Generate skin cards
    for (var i = 0; i < TOTAL_SKINS; i++) {
      var card = document.createElement('div');
      card.className = 'skin-card' + (i === playerSkinId ? ' selected' : '');
      card.setAttribute('data-skin-id', i);

      var canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      card.appendChild(canvas);

      var label = document.createElement('span');
      label.textContent = 'Skin ' + i;
      card.appendChild(label);

      skinGrid.appendChild(card);

      // Load and draw character preview
      loadSkinPreview(canvas, i);

      // Click handler
      card.addEventListener('click', (function(skinId) {
        return function() {
          // Remove previous selection
          var prev = skinGrid.querySelector('.skin-card.selected');
          if (prev) prev.classList.remove('selected');
          // Select this one
          this.classList.add('selected');
          playerSkinId = skinId;
          validateForm();
        };
      })(i));
    }

    // Nickname input handler
    nicknameInput.addEventListener('input', function() {
      playerNickname = this.value.trim();
      validateForm();
    });

    // Allow Enter key to start game
    nicknameInput.addEventListener('keydown', function(e) {
      if (e.keyCode === 13 && !playBtn.disabled) {
        startGame();
      }
    });

    // Play button click
    playBtn.addEventListener('click', function() {
      if (!this.disabled) {
        startGame();
      }
    });

    // Initial validation
    validateForm();
  }

  function loadSkinPreview(canvas, skinId) {
    var img = new Image();
    img.onload = function() {
      var ctx = canvas.getContext('2d');
      // Calculate frame position in the sprite sheet (4 cols x 4 rows)
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

  function validateForm() {
    var playBtn = document.getElementById('play-btn');
    var nickname = (playerNickname || '').trim();
    var valid = nickname.length >= 1 && nickname.length <= 16 && playerSkinId >= 0;
    playBtn.disabled = !valid;
  }

  function startGame() {
    var nickname = (playerNickname || '').trim();
    if (nickname.length === 0) {
      playerNickname = 'Player';
    }

    // Persist nickname and skin to localStorage
    localStorage.setItem('bomber_nickname', playerNickname);
    localStorage.setItem('bomber_skinId', playerSkinId);

    // Hide lobby
    document.getElementById('lobby-screen').style.display = 'none';

    // Auto-join first available room
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/rooms', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          var rooms = JSON.parse(xhr.responseText);
          if (rooms && rooms.length > 0) {
            // Pick first room with space available
            var target = null;
            for (var i = 0; i < rooms.length; i++) {
              if (rooms[i].playerCount < rooms[i].maxPlayers) {
                target = rooms[i];
                break;
              }
            }
            if (!target) target = rooms[0]; // fallback to first room
            if (typeof RoomUI !== 'undefined') {
              RoomUI.joinRoom(target.id);
            }
          } else {
            // Fallback: create a room via POST (shouldn't happen with auto-create)
            var postXhr = new XMLHttpRequest();
            postXhr.open('POST', '/api/rooms', true);
            postXhr.setRequestHeader('Content-Type', 'application/json');
            postXhr.onreadystatechange = function() {
              if (postXhr.readyState === 4 && (postXhr.status === 201 || postXhr.status === 200)) {
                var room = JSON.parse(postXhr.responseText);
                if (typeof RoomUI !== 'undefined') {
                  RoomUI.joinRoom(room.id);
                }
              }
            };
            postXhr.send(JSON.stringify({ name: 'Arena', maxPlayers: 8, themeId: 'random' }));
          }
        } catch (e) {
          console.error('Failed to fetch rooms:', e);
        }
      }
    };
    xhr.send();
  }

  // Initialize lobby when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLobby);
  } else {
    initLobby();
  }
})();
