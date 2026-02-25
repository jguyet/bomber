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
				break ;
				case "K":
					switch (action)
					{
						case "F": // Kill feed: KF{killerId}|{killerNick}|{victimId}|{victimNick}
							var parts = received_msg.substring(2).split("|");
							var killEvent = { killerId: Number(parts[0]), killerNick: parts[1], victimId: Number(parts[2]), victimNick: parts[3], time: Date.now() };
							killFeed.push(killEvent);
							if (typeof HUD !== 'undefined') HUD.addKillFeedEntry(killEvent);
							addKillToChat(killEvent.killerNick, killEvent.victimNick);
						break ;
					}
				break ;
				case "M":
					switch (action)
					{
						case "N":
							var chatData = received_msg.substring(2);
							var separatorIdx = chatData.indexOf('|');
							if (separatorIdx !== -1) {
								var senderNick = chatData.substring(0, separatorIdx);
								var chatText = chatData.substring(separatorIdx + 1);
								addmessagetochat(senderNick, chatText);
							} else {
								addmessagetochat("Unknown", chatData);
							}
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
						case "K": // Player killed: PK{id}
							var id = Number(received_msg.substring(2));
							var player = world.getPlayer(id);
							if (player != null) {
								player.alive = false;
								player.remove();
							}
							if (currentPlayer && id === currentPlayer.id) {
								isSpectating = true;
								if (typeof HUD !== 'undefined') HUD.showDeathNotice();
							}
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
				case "R":
					switch (action)
					{
						case "S": // Round state: RS{state}|{timeRemainingMs}
							var parts = received_msg.substring(2).split("|");
							roundState = parts[0];
							roundTimeRemaining = Number(parts[1]);
							if (typeof HUD !== 'undefined') HUD.updateRoundState(roundState, roundTimeRemaining);
						break ;
						case "W": // Round winner: RW{winnerId}|{winnerNickname}
							var parts = received_msg.substring(2).split("|");
							roundWinner = { id: Number(parts[0]), nickname: parts[1] };
						break ;
						case "R": // Round reset: RR
							if (typeof HUD !== 'undefined') HUD.hideResults();
							roundWinner = null;
							roundResults = [];
							killFeed = [];
							isSpectating = false;
						break ;
						case "E": // Round end results: RE{winnerId}|{winnerNick}|{id}|{nick}|{kills}|{deaths};...
							var data = received_msg.substring(2);
							var playerEntries = data.split(";");
							var firstEntry = playerEntries[0].split("|");
							roundWinner = { id: Number(firstEntry[0]), nickname: firstEntry[1] };
							roundResults = [];
							for (var i = 0; i < playerEntries.length; i++) {
								var p = playerEntries[i].split("|");
								if (p.length >= 6) {
									roundResults.push({ id: Number(p[2]), nickname: p[3], kills: Number(p[4]), deaths: Number(p[5]) });
								}
							}
							if (typeof HUD !== 'undefined') HUD.showResults(roundWinner, roundResults);
						break ;
					}
				break ;
				case "S":
					switch (action)
					{
						case "B": // Scoreboard: SB{id}|{nick}|{kills}|{deaths};{id2}|...
							var entries = received_msg.substring(2).split(";");
							scoreboardData = [];
							for (var i = 0; i < entries.length; i++) {
								var p = entries[i].split("|");
								if (p.length >= 4) {
									scoreboardData.push({ id: Number(p[0]), nickname: p[1], kills: Number(p[2]), deaths: Number(p[3]) });
								}
							}
							if (typeof HUD !== 'undefined') HUD.updateScoreboard(scoreboardData);
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

function addKillToChat(killerNick, victimNick) {
	var elem = document.createElement("li");
	elem.setAttribute("class", "ng-scope kill-info");
	elem.innerHTML = '<span class="ico bombed"></span> <b class="nickname">' + escapeHtml(killerNick) + '</b> killed <b class="nickname">' + escapeHtml(victimNick) + '</b>';
	var chat = document.getElementById("endchat");
	chat.parentNode.insertBefore(elem, chat);
	var chatList = document.getElementById("listChat");
	if (chatList) chatList.scrollTop = chatList.scrollHeight;
}
