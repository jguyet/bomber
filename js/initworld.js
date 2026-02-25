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
	fosfo0.loadimage(['assets/maps/1.png']).done(function() {
		fosfo1.loadimage(['assets/bombs/1.png', 'assets/bombs/explode/1.png']).done(function() {
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