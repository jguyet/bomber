/**
 * Socket.io client (replaces raw WebSocket connection)
 *
 * Protocol: all messages are plain strings prefixed with 2 chars [TYPE][ACTION]
 * This matches the Node.js server's socket.emit('msg', ...) / socket.on('msg', ...)
 */

function sendSocketMessage(message)
{
	console.log("send : " + message);
	socket.emit('msg', message);
}

function InitializeSocket()
{
	// Connect to the game server via socket.io (same origin, /ws path)
	socket = io({
		path: '/ws',
		transports: ['websocket']
	});

	socket.on('connect', function()
	{
		sendSocketMessage("WL");
		console.log("Connection OK");
		initWorld();
	});

	socket.on('msg', function (received_msg)
	{
		var type = received_msg.charAt(0);
		var action = received_msg.charAt(1);
		console.log("received : " + received_msg);
		switch (type)
		{
			case "B":
				switch (action)
				{
					case "A":
						var id = Number(received_msg.substring(2).split("|")[0]);
						var x = Number(received_msg.substring(2).split("|")[1]);
						var y = Number(received_msg.substring(2).split("|")[2]);
						var range = Number(received_msg.substring(2).split("|")[3]);
						var bomb = new Bomb(id, x, y, range);
						bomb.start();
						world.addbomb(bomb);
					break ;
					case "E":
						var id = Number(received_msg.substring(2).split("|")[0]);
						var sup = Number(received_msg.substring(2).split("|")[1]);
						var down = Number(received_msg.substring(2).split("|")[2]);
						var left = Number(received_msg.substring(2).split("|")[3]);
						var right = Number(received_msg.substring(2).split("|")[4]);
						var bomb = world.getBomb(id);
						bomb.exsup = sup;
						bomb.exleft = left;
						bomb.exdown = down;
						bomb.exright = right;
						bomb.explode();
					break ;
				}
			break ;
			case "M":
				switch (action)
				{
					case "N":
						addmessagetochat(received_msg.substring(2));
					break ;
				}
			break ;
			case "P":
				switch (action)
				{
					case "A":
						var id = Number(received_msg.substring(2).split("|")[0]);
						var x = Number(received_msg.substring(2).split("|")[1]);
						var y = Number(received_msg.substring(2).split("|")[2]);
						var dir = Number(received_msg.substring(2).split("|")[3]);
						var skin = Number(received_msg.substring(2).split("|")[4]);
						var bcurrent = Number(received_msg.substring(2).split("|")[5]);
						world.addplayer(id, x, y, dir, skin, bcurrent);
					break ;
					case "D":
						var id = Number(received_msg.substring(2).split("|")[0]);
						world.removeplayer(id);
					break ;
					case "M":
						var id = Number(received_msg.substring(2).split("|")[0]);
						var x = Number(received_msg.substring(2).split("|")[1]);
						var y = Number(received_msg.substring(2).split("|")[2]);
						var dir = Number(received_msg.substring(2).split("|")[3]);
						var skin = Number(received_msg.substring(2).split("|")[4]);
						var bytedir = Number(received_msg.substring(2).split("|")[5]);
						world.moveplayer(id, x, y, dir, skin, false, bytedir);
					break ;
					case "S":
						var id = Number(received_msg.substring(2).split("|")[0]);
						var x = Number(received_msg.substring(2).split("|")[1]);
						var y = Number(received_msg.substring(2).split("|")[2]);
						var dir = Number(received_msg.substring(2).split("|")[3]);
						var skin = Number(received_msg.substring(2).split("|")[4]);
						var bytedir = Number(received_msg.substring(2).split("|")[5]);
						world.moveplayer(id, x, y, dir, skin, true, bytedir);
					break ;
				}
			break ;
			case "W":
				switch (action)
				{
					case "L":
						fosfo0.clear();
						world = new World(received_msg.substring(2));
						world.loadWorld();
					break ;
					case "C":
						var x = Number(received_msg.substring(2).split("|")[1]);
						var y = Number(received_msg.substring(2).split("|")[2]);
						var id = Number(received_msg.substring(2).split("|")[0]);
						var img = world.dataimg[y][x];
						//fosfo0.undraw(img.name);
						world.dataimg[y][x] = fosfo0.drawframe(img.name, 'assets/maps/1.png', id, img.x, img.y);
						world.havechange = true;
					break ;
				}
			break ;
		}
	});

	socket.on('disconnect', function()
	{
		console.log("Socket disconnected, reconnecting in 1s...");
		setTimeout(InitializeSocket, 1000);
	});

	socket.on('connect_error', function()
	{
		console.log("Socket connection error, retrying...");
	});
}
