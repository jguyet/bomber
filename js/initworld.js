// Rounded rectangle helper with fallback for older browsers
function drawRoundRect(ctx, x, y, w, h, r) {
	if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); return; }
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + r, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y + h - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.fill();
}

// Initialize canvas engines (fosfo0/fosfo1) without loading images or connecting
function initCanvas() {
	layer0 = document.getElementById("layer0");
	layer1 = document.getElementById("layer1");
	ctx0 = layer0.getContext("2d");
	ctx1 = layer1.getContext("2d");
	fosfo0 = new fosfo(layer0);
	fosfo1 = new fosfo(layer1);
	fosfo0.x = (window.innerWidth - (40 * 32)) / 2;
	fosfo0.y = 32;
	fosfo1.x = (window.innerWidth - (40 * 32)) / 2;
	fosfo1.y = 32;
}

// Load tileset and entity images, then call onReady callback
function loadGameAssets(onReady) {
	var tilesetPath = THEME_TILESETS[currentTheme] || THEME_TILESETS['default'];
	fosfo0.loadimage([tilesetPath]).done(function() {
		LoadingManager.assetLoaded(tilesetPath);
		fosfo1.loadimage(['assets/bombs/1.png', 'assets/bombs/explode/1.png', 'assets/items/1.png']).done(function() {
			LoadingManager.assetLoaded('assets/bombs/1.png');
			LoadingManager.assetLoaded('assets/bombs/explode/1.png');
			LoadingManager.assetLoaded('assets/items/1.png');
			if (onReady) onReady();
		});
	});
}

function preload()
{
	// Show loading screen
	LoadingManager.show();
	// Total assets: map sprite (1) + bomb sprite (1) + explosion sprite (1) + item sprite (1) + connecting (1) + world init (1) = 6
	LoadingManager.setTotal(6);

	// Initialize canvas engines
	initCanvas();

	// Load game assets then connect
	loadGameAssets(function() {
		LoadingManager.setStatus('Connecting to server...');
		InitializeSocket();
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
	// Initialize chat smart auto-scroll
	if (typeof initChatScroll === 'function') initChatScroll();
	console.log("START");
	var tilesetPath = THEME_TILESETS[currentTheme] || THEME_TILESETS['default'];
	fosfo0.setFramesToImg(tilesetPath, 8, 24);
	fosfo1.setFramesToImg('assets/bombs/1.png', 1, 9);
	fosfo1.setFramesToImg('assets/bombs/explode/1.png', 4, 2);
	fosfo1.setFramesToImg('assets/items/1.png', 3, 9);
	setInterval(interval, 1000 / 60);
	resize(false);
}

var lastCalledTime;
var fps;

function requestAnimFrame() {

  if(!lastCalledTime) {
     lastCalledTime = Date.now();
     fps = 0;
     return;
  }
  delta = (Date.now() - lastCalledTime)/1000;
  lastCalledTime = Date.now();
  fps = 1/delta;
}

var interval = function()
{
	var dup = [];
	if (world != null)
	{
		if (world.updateplayers != null)
			world.updateplayers();
		if (world.updatebombs != null)
			world.updatebombs();
		if (world.updateitems != null)
			world.updateitems();
		world.setDup();
		dup = world.dup;
		// if (world.havechange)
		// {

			fosfo0.update(dup);
			world.havechange = false;
		// }
	}
	updatelayer1();
	requestAnimFrame();
	fosfo1.update(dup);
	// Draw player nicknames above sprites after canvas render
	if (world != null && world.players != null) {
		var ctx = fosfo1.ctx;
		ctx.save();
		ctx.font = "bold 11px Arial";
		ctx.textAlign = "center";
		var badgePadding = 3;
		var badgeHeight = 14;
		for (var i = 0; i < world.players.length; i++) {
			var p = world.players[i];
			if (p == null || p.img == null) continue;
			var px = (p.x % (world.width * 32)) + fosfo1.x + 16;
			var py = (p.y % (world.height * 32)) - (p.img.height - 20) + fosfo1.y - 4;
			var textWidth = ctx.measureText(p.nickname).width;
			var isCurrentPlayer = (typeof currentPlayer !== 'undefined' && currentPlayer && p.id === currentPlayer.id);
			var badgeBg = isCurrentPlayer ? "rgba(0, 100, 200, 0.6)" : "rgba(0, 0, 0, 0.55)";
			// Draw badge background
			var bx = px - textWidth / 2 - badgePadding;
			var by = py - badgeHeight + 2;
			var bw = textWidth + badgePadding * 2;
			var bh = badgeHeight;
			ctx.fillStyle = badgeBg;
			drawRoundRect(ctx, bx, by, bw, bh, 3);
			// Draw text
			ctx.fillStyle = "#ffffff";
			ctx.fillText(p.nickname, px, py);
			// Draw for duplicates (world wrap)
			for (var d = 0; d < dup.length; d++) {
				var dpx = px + dup[d][0];
				var dpy = py + dup[d][1];
				// Badge for duplicate
				ctx.fillStyle = badgeBg;
				drawRoundRect(ctx, dpx - textWidth / 2 - badgePadding, dpy - badgeHeight + 2, bw, bh, 3);
				// Text for duplicate
				ctx.fillStyle = "#ffffff";
				ctx.fillText(p.nickname, dpx, dpy);
			}
		}
		ctx.restore();
	}
}

// preload() is now called by the lobby PLAY button (js/lobby.js)
// Do NOT auto-start on DOMContentLoaded
