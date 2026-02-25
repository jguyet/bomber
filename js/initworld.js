var selectedSkinId = 0;

function showLobby() {
	var lobby = document.getElementById('lobby-screen');
	if (lobby) lobby.style.display = 'flex';

	// Populate skin grid with 24 thumbnails
	var grid = document.getElementById('skin-grid');
	if (grid) {
		grid.innerHTML = '';
		for (var i = 0; i < 24; i++) {
			(function(skinIdx) {
				var img = document.createElement('img');
				img.src = 'assets/characters/' + skinIdx + '.png';
				img.width = 42;
				img.height = 42;
				img.className = 'skin-thumb' + (skinIdx === 0 ? ' selected' : '');
				img.setAttribute('data-skin', skinIdx);
				img.addEventListener('click', function() {
					var all = grid.querySelectorAll('.skin-thumb');
					for (var j = 0; j < all.length; j++) all[j].classList.remove('selected');
					img.classList.add('selected');
					selectedSkinId = skinIdx;
				});
				grid.appendChild(img);
			})(i);
		}
	}

	// Wire PLAY button
	var playBtn = document.getElementById('play-btn');
	if (playBtn) {
		playBtn.onclick = function() {
			var nicknameInput = document.getElementById('nickname-input');
			var nickname = nicknameInput ? nicknameInput.value.trim() : '';
			if (!nickname) nickname = 'Player';
			startGame(nickname, selectedSkinId);
		};
	}
}

// Loading progress helpers
function setLoadingProgress(label, pct) {
	var fill = document.getElementById('loading-bar-fill');
	var lbl = document.getElementById('loading-label');
	if (fill) fill.style.width = pct + '%';
	if (lbl) lbl.textContent = label;
}

function dismissLoadingOverlay() {
	var el = document.getElementById('loading-overlay');
	if (el) el.style.display = 'none';
}

function startGame(nickname, skinId) {
	// Store for reconnect
	window._lastNickname = nickname;
	window._lastSkinId = skinId;

	// Hide lobby, show loading
	var lobbyScreen = document.getElementById('lobby-screen');
	if (lobbyScreen) lobbyScreen.style.display = 'none';
	var loadingOverlay = document.getElementById('loading-overlay');
	if (loadingOverlay) loadingOverlay.style.display = 'flex';

	setLoadingProgress('Connecting…', 10);
	InitializeSocket(nickname, skinId);
}

function preload()
{
	//Canvas------------------------------------------//
	layer0 = document.getElementById("layer0");
	layer1 = document.getElementById("layer1");
	ctx0 = layer0.getContext("2d");
	ctx1 = layer1.getContext("2d");
	fosfo0 = new fosfo(layer0);
	fosfo1 = new fosfo(layer1);
	resize(false);

	// Set loading callback for when world data arrives
	window.onWorldReady = function() {
		setLoadingProgress('Ready!', 100);
		setTimeout(dismissLoadingOverlay, 400);
	};

	fosfo0.loadimage(['assets/maps/1.png']).done(function() {
		setLoadingProgress('Loading map…', 33);
		fosfo1.loadimage(['assets/bombs/1.png', 'assets/bombs/explode/1.png']).done(function() {
			setLoadingProgress('Loading bombs…', 66);
			// Assets loaded — show lobby instead of connecting immediately
			showLobby();
		});
	});
}

function initWorld()
{
	//Events------------------------------------------//
	document.addEventListener('click', onMouseClick, false );
	document.addEventListener('mousedown', onMouseDown, false);
	document.addEventListener('mouseup', onMouseUp, false);
	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('mouseout', onMouseOut, false);
	document.addEventListener('keydown', onKeyDown, false );
	document.addEventListener('keyup', onKeyUp, false );
	document.addEventListener('mousewheel', onrool, false);
	window.addEventListener( 'resize', onWindowResize, false );
	fosfo0.setFramesToImg('assets/maps/1.png', 8, 24);
	fosfo1.setFramesToImg('assets/bombs/1.png', 1, 9);
	fosfo1.setFramesToImg('assets/bombs/explode/1.png', 4, 2);
	function loop() {
		interval();
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
	resize(false);
}

var interval = function()
{
	// Camera: follow currentPlayer, no clamping (map wraps via dup)
	if (currentPlayer != null) {
		cameraX = currentPlayer.x - (layer0.width / 2);
		cameraY = currentPlayer.y - (layer0.height / 2);
		// Apply camera to both layers (fosfo uses .x/.y as draw offset)
		fosfo0.x = -cameraX;
		fosfo0.y = -cameraY + 32;
		fosfo1.x = -cameraX;
		fosfo1.y = -cameraY + 32;
	}
	var dup = [];
	if (world != null)
	{
		flushPendingMoves(); // apply buffered PM messages (at most 1 per player per frame)
		if (world.updateplayers != null)
			world.updateplayers();
		if (world.updatebombs != null)
			world.updatebombs();
		// Recompute dup offsets relative to current camera position each frame
		world.updateDup(cameraX, cameraY, layer0.width, layer0.height);
		dup = world.dup;
		// Always redraw layer0: camera offset changes every frame
		fosfo0.update(dup);
		world.havechange = false;
	}
	updatelayer1();
	fosfo1.update(dup);
}

window.addEventListener("DOMContentLoaded", function()
{
	preload();
}, false);
