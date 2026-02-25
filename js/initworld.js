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
	fosfo0.loadimage(['assets/maps/1.png']).done(function() {
		LoadingManager.assetLoaded('assets/maps/1.png');
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
	fosfo0.setFramesToImg('assets/maps/1.png', 8, 24);
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
}

// preload() is now called by the lobby PLAY button (js/lobby.js)
// Do NOT auto-start on DOMContentLoaded
