function sendSocketMessage(message)
{
	console.log("send : " + message);
	socket.send(message);
}

var reconnectAttempt = 0;

function InitializeSocket()
{
	if ("WebSocket" in window)
	{
		// Let us open a web socket
		socket = new WebSocket("ws://localhost:9998/echo");

		socket.onopen = function()
		{
			reconnectAttempt = 0;
			ConnectionStatus.onConnected();
			LoadingManager.assetLoaded('Server connection');
			LoadingManager.setStatus('Loading world...');
			sendSocketMessage("NI" + playerNickname + "|" + playerSkinId);
			sendSocketMessage("WL");
			initWorld();
			console.log("Connection OK");
		};

		socket.onmessage = function (evt)
		{
			var received_msg = evt.data;
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
							if (bomb != undefined) {
								bomb.exsup = sup;
								bomb.exleft = left;
								bomb.exdown = down;
								bomb.exright = right;
								bomb.explode();
							}
						break ;
					}
				break ;
				case "I":
					switch (action)
					{
						case "A": // add item
							var id = Number(received_msg.substring(2).split("|")[0]);
							var templateId = Number(received_msg.substring(2).split("|")[1]);
							var x = Number(received_msg.substring(2).split("|")[2]);
							var y = Number(received_msg.substring(2).split("|")[3]);
							var item = new Item(id, templateId, x, y);
							item.start();
							world.additem(item);
						break ;
						case "D": // delete item
							var id = Number(received_msg.substring(2).split("|")[0]);
							var templateId = Number(received_msg.substring(2).split("|")[1]);
							var x = Number(received_msg.substring(2).split("|")[2]);
							var y = Number(received_msg.substring(2).split("|")[3]);
							var item = world.getItem(id);
							if (item != undefined) {
								item.delete();
							}
						break ;
						case "S": // item speed
							var id = Number(received_msg.substring(2).split("|")[0]);
							var speed = Number(received_msg.substring(2).split("|")[1]);
							world.setPlayerSpeed(id, speed);
						break ;
					}
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
							var speed = Number(received_msg.substring(2).split("|")[5]);
							var bcurrent = Number(received_msg.substring(2).split("|")[6]);
							var nickname = received_msg.substring(2).split("|")[7] || "Player";
							world.addplayer(id, x, y, dir, skin, speed, bcurrent, nickname);
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
							var nickname = received_msg.substring(2).split("|")[7] || "";
							world.moveplayer(id, x, y, dir, skin, false, bytedir, nickname);
						break ;
						case "S":
							var id = Number(received_msg.substring(2).split("|")[0]);
							var x = Number(received_msg.substring(2).split("|")[1]);
							var y = Number(received_msg.substring(2).split("|")[2]);
							var dir = Number(received_msg.substring(2).split("|")[3]);
							var skin = Number(received_msg.substring(2).split("|")[4]);
							var bytedir = Number(received_msg.substring(2).split("|")[5]);
							var nickname = received_msg.substring(2).split("|")[7] || "";
							world.moveplayer(id, x, y, dir, skin, true, bytedir, nickname);
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
							LoadingManager.assetLoaded('World data');
							LoadingManager.worldReady();
							sendSocketMessage("WE"); // load entities
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
		};

		socket.onclose = function()
		{
			console.log("Socket connection closed.");
			if (reconnectAttempt < ConnectionStatus.maxRetries) {
				ConnectionStatus.onDisconnected();
				ConnectionStatus.onRetrying(reconnectAttempt);
				reconnectAttempt++;
				setTimeout(InitializeSocket, 2000);
			} else {
				ConnectionStatus.onPermanentFailure();
			}
		};
	}
	else
	{

	}
	if (socket == null)
	{
		console.log("Socket connection failed.");
		if (reconnectAttempt < ConnectionStatus.maxRetries) {
			ConnectionStatus.onDisconnected();
			ConnectionStatus.onRetrying(reconnectAttempt);
			reconnectAttempt++;
			setTimeout(InitializeSocket, 2000);
		} else {
			ConnectionStatus.onPermanentFailure();
		}
	}
}
