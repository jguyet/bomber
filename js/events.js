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
		if (SIZE < -10)
			return ;
		SIZE -= 0.1;
	}
	else
	{
		if (SIZE > 10)
			return ;
		SIZE += 0.1;
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
	if (isSpectating || isFullSpectator) return;
	if (keyState[event.keyCode || event.which] == true)
		return ;
	keyState[event.keyCode || event.which] = true;
	sendSocketMessage("KD" + (event.keyCode || event.which));
}

function onKeyUp( event )
{
	if (isSpectating || isFullSpectator) return;
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
	fosfo0.x = (window.innerWidth - (40 * 32)) / 2;
	fosfo0.y = 32;
	fosfo1.x = (window.innerWidth - (40 * 32)) / 2;
	fosfo1.y = 32;
	if (world != null)
	{
		world.havechange = true;
	}
};

var updatelayer1 = function()
{
	if (currentPlayer == null)
		return ;
	currentPlayer.update();
};

