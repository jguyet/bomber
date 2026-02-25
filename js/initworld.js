function preload()
{
	// Show loading screen
	LoadingManager.show();
	// Total assets: map sprite (1) + bomb sprite (1) + explosion sprite (1) + item sprite (1) + connecting (1) + world init (1) = 6
	LoadingManager.setTotal(6);

	//Canvas------------------------------------------//
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
	// Use theme-aware tileset path
	var tilesetPath = THEME_TILESETS[currentTheme] || THEME_TILESETS['default'];
	fosfo0.loadimage([tilesetPath]).done(function() {
		LoadingManager.assetLoaded(tilesetPath);
		fosfo1.loadimage(['assets/bombs/1.png', 'assets/bombs/explode/1.png', 'assets/items/1.png']).done(function() {
			LoadingManager.assetLoaded('assets/bombs/1.png');
			LoadingManager.assetLoaded('assets/bombs/explode/1.png');
			LoadingManager.assetLoaded('assets/items/1.png');
			LoadingManager.setStatus('Connecting to server...');
			InitializeSocket();
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
		for (var i = 0; i < world.players.length; i++) {
			var p = world.players[i];
			if (p == null || p.img == null) continue;
			var px = (p.x % (world.width * 32)) + fosfo1.x + 16;
			var py = (p.y % (world.height * 32)) - (p.img.height - 20) + fosfo1.y - 4;
			// Draw text shadow
			ctx.fillStyle = "rgba(0,0,0,0.7)";
			ctx.fillText(p.nickname, px + 1, py + 1);
			// Draw text
			ctx.fillStyle = "#ffffff";
			ctx.fillText(p.nickname, px, py);
			// Draw for duplicates (world wrap)
			for (var d = 0; d < dup.length; d++) {
				var dpx = px + dup[d][0];
				var dpy = py + dup[d][1];
				ctx.fillStyle = "rgba(0,0,0,0.7)";
				ctx.fillText(p.nickname, dpx + 1, dpy + 1);
				ctx.fillStyle = "#ffffff";
				ctx.fillText(p.nickname, dpx, dpy);
			}
		}
		ctx.restore();
	}
}

// preload() is now called by the lobby PLAY button (js/lobby.js)
// Do NOT auto-start on DOMContentLoaded
