function onMouseClick()
{
	
}
function onMouseDown(event)
{
	if(navigator.appName=="Microsoft Internet Explorer")
	{
		var x = event.x+document.body.scrollLeft;
		var y = event.y+document.body.scrollTop;
	}
	else
	{
		var x =  event.pageX;
		var y =  event.pageY;
	}
	console.log(fosfo0.getelementPos(x, y));
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
		world.havechange = true;
		// Force immediate redraw after resize clears canvas buffers
		fosfo0.update(world.dup);
	}
};

var checkKeyStates = function(){

	var press = false;
	var key = 0;
    if (keyState[38] || keyState[87]) {
        // up arrow or 'w' - move forward
		key += 4;
		press = true;
    }
    if (keyState[40] || keyState[83]) {
        // down arrow or 's' - move backward
		key += 16;
		press = true;
    }
    if (keyState[37] || keyState[65]) {
        // left arrow or 'a' - rotate left
		key += 32;
		press = true;
    }
    if (keyState[39] || keyState[68]) {
        // right arrow or 'd' - rotate right
		key += 8;
		press = true;
    }
    if (keyState[81]) {
        // 'q' - strafe left
		console.log("strafe left");
    }
    if (keyState[69]) {
        // 'e' - strage right
		console.log("strafe right");
    }
	if (keyState[32]) {
		keyState[32] = false;
		key += 128;
		press = true;
    }
};

var updatelayer1 = function()
{
	if (currentPlayer == null)
		return ;
	currentPlayer.update();
};

var sendpos = function()
{
	currentPlayer.sendpos();
};