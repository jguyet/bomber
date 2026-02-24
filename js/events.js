function onMouseClick()
{
	
}
function onMouseDown(event)
{
	var x = event.pageX;
	var y = event.pageY;
}
function onMouseUp()
{
	
}
function onrool()
{
	var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail )));
	if (delta == -1)
	{
		if (SIZE < -19)
			return ;
		SIZE--;
	}
	else
	{
		if (SIZE > 15)
			return ;
		SIZE++;
	}
}
function onMouseMove()
{
	
}
function onMouseOut()
{
	
}
function onKeyDown( event )
{
	if (keyState[event.keyCode || event.which] == true)
		return ;
	keyState[event.keyCode || event.which] = true;
	sendSocketMessage("KD" + (event.keyCode || event.which));
}

function onKeyUp( event )
{
	keyState[event.keyCode || event.which] = false;
	sendSocketMessage("KU" + (event.keyCode || event.which));
}
function onWindowResize()
{
	resize(true);
}

var resize = function(bool){
	//longueur width / bloc_size
	SCREENWIDTH = window.innerWidth;
	SCREENHEIGHT = window.innerHeight;
	layer0.width = SCREENWIDTH;// - 212;
	layer1.width = SCREENWIDTH;// - 212;
	layer0.height = SCREENHEIGHT;
	layer1.height = SCREENHEIGHT;
	fosfo0.x = Math.max(0, (window.innerWidth - (40 * 32)) / 2);
	fosfo0.y = 32;
	fosfo1.x = Math.max(0, (window.innerWidth - (40 * 32)) / 2);
	fosfo1.y = 32;
	if (world != null)
	{
		// Recompute dup to cover full canvas including area left of fosfo0.x offset
		var mapW = world.width * 32;
		var mapH = world.height * 32;
		var offsetX = fosfo0.x;
		var newDup = [];
		// Start from negative offset to cover pixels left of offsetX
		var startOx = -Math.ceil(offsetX / mapW) * mapW;
		for (var ox = startOx; ox < SCREENWIDTH; ox += mapW)
		{
			for (var oy = 0; oy < SCREENHEIGHT; oy += mapH)
			{
				if (ox !== 0 || oy !== 0)
					newDup.push([ox, oy]);
			}
		}
		world.dup = newDup;
		world.havechange = true;
		// Force immediate redraw after resize clears canvas buffers
		fosfo0.update(world.dup);
	}
};

var updatelayer1 = function()
{
	if (currentPlayer == null)
		return ;
	currentPlayer.update();
};

