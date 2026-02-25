function sendSocketMessage(message)
{
	console.log("send : " + message);
	socket.emit('game', message);
}

var reconnectAttempt = 0;

function InitializeSocket()
{
	// Connect to Socket.io server (same host, port 9998)
	socket = io('ws://localhost:9998', { path: '/echo', transports: ['websocket'] });

	socket.on('connect', function()
	{
		reconnectAttempt = 0;
		ConnectionStatus.onConnected();
		LoadingManager.assetLoaded('Server connection');
		LoadingManager.setStatus('Joining room...');

		// Send nickname/skin init
		socket.emit('nicknameInit', { nickname: playerNickname, skinId: playerSkinId });

		// Join room (currentRoomId must be set before calling InitializeSocket)
		if (currentRoomId) {
			socket.emit('joinRoom', currentRoomId);
		}

		console.log("Socket.io connected");
	});

	// All game protocol messages come via 'game' event
	socket.on('game', function(received_msg)
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
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var x = Number(received_msg.substring(2).split("|")[1]);
							var y = Number(received_msg.substring(2).split("|")[2]);
							var range = Number(received_msg.substring(2).split("|")[3]);
							var bomb = new Bomb(id, x, y, range);
							bomb.start();
							world.addbomb(bomb);
						}
					break ;
					case "E":
						if (world != null) {
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
						}
					break ;
				}
			break ;
			case "I":
				switch (action)
				{
					case "A": // add item
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var templateId = Number(received_msg.substring(2).split("|")[1]);
							var x = Number(received_msg.substring(2).split("|")[2]);
							var y = Number(received_msg.substring(2).split("|")[3]);
							var item = new Item(id, templateId, x, y);
							item.start();
							world.additem(item);
						}
					break ;
					case "D": // delete item
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var templateId = Number(received_msg.substring(2).split("|")[1]);
							var x = Number(received_msg.substring(2).split("|")[2]);
							var y = Number(received_msg.substring(2).split("|")[3]);
							var item = world.getItem(id);
							if (item != undefined) {
								item.delete();
							}
						}
					break ;
					case "S": // item speed
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var speed = Number(received_msg.substring(2).split("|")[1]);
							world.setPlayerSpeed(id, speed);
						}
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
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var x = Number(received_msg.substring(2).split("|")[1]);
							var y = Number(received_msg.substring(2).split("|")[2]);
							var dir = Number(received_msg.substring(2).split("|")[3]);
							var skin = Number(received_msg.substring(2).split("|")[4]);
							var speed = Number(received_msg.substring(2).split("|")[5]);
							var bcurrent = Number(received_msg.substring(2).split("|")[6]);
							var nickname = received_msg.substring(2).split("|")[7] || "Player";
							world.addplayer(id, x, y, dir, skin, speed, bcurrent, nickname);
						}
					break ;
					case "D":
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							world.removeplayer(id);
						}
					break ;
					case "M":
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var x = Number(received_msg.substring(2).split("|")[1]);
							var y = Number(received_msg.substring(2).split("|")[2]);
							var dir = Number(received_msg.substring(2).split("|")[3]);
							var skin = Number(received_msg.substring(2).split("|")[4]);
							var bytedir = Number(received_msg.substring(2).split("|")[5]);
							var nickname = received_msg.substring(2).split("|")[7] || "";
							world.moveplayer(id, x, y, dir, skin, false, bytedir, nickname);
						}
					break ;
					case "S":
						if (world != null) {
							var id = Number(received_msg.substring(2).split("|")[0]);
							var x = Number(received_msg.substring(2).split("|")[1]);
							var y = Number(received_msg.substring(2).split("|")[2]);
							var dir = Number(received_msg.substring(2).split("|")[3]);
							var skin = Number(received_msg.substring(2).split("|")[4]);
							var bytedir = Number(received_msg.substring(2).split("|")[5]);
							var nickname = received_msg.substring(2).split("|")[7] || "";
							world.moveplayer(id, x, y, dir, skin, true, bytedir, nickname);
						}
					break ;
					case "K": // Player killed: PK{id}
						if (world != null) {
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
						}
					break ;
				}
			break ;
			case "T":
				switch (action)
				{
					case "H": // TH{themeId} - set active theme
						var newTheme = received_msg.substring(2);
						if (newTheme !== currentTheme) {
							currentTheme = newTheme;
							var newTilesetPath = THEME_TILESETS[currentTheme] || THEME_TILESETS['default'];
							// Preload new tileset into fosfo0 if it exists
							if (typeof fosfo0 !== 'undefined' && fosfo0 && fosfo0.loadimage) {
								fosfo0.loadimage([newTilesetPath]).done(function() {
									fosfo0.setFramesToImg(newTilesetPath, 8, 24);
									if (world) world.tilesetPath = newTilesetPath;
								});
							}
						} else {
							currentTheme = newTheme;
						}
						console.log('Theme set to:', currentTheme);
						// Update HUD theme indicator
						if (typeof HUD !== 'undefined' && HUD.setRoomInfo) {
							HUD.setRoomInfo(currentRoomName || '', currentTheme);
						}
					break ;
				}
			break ;
			case "W":
				switch (action)
				{
					case "L":
						if (typeof fosfo0 !== 'undefined' && fosfo0) {
							fosfo0.clear();
							world = new World(received_msg.substring(2), currentTheme);
							world.loadWorld();
							LoadingManager.assetLoaded('World data');
							LoadingManager.worldReady();
							sendSocketMessage("WE"); // load entities
						}
					break ;
					case "C":
						if (world != null && typeof fosfo0 !== 'undefined' && fosfo0) {
							var x = Number(received_msg.substring(2).split("|")[1]);
							var y = Number(received_msg.substring(2).split("|")[2]);
							var id = Number(received_msg.substring(2).split("|")[0]);
							var img = world.dataimg[y][x];
							var tilesetPath = (world && world.tilesetPath) || THEME_TILESETS[currentTheme] || THEME_TILESETS['default'];
							world.dataimg[y][x] = fosfo0.drawframe(img.name, tilesetPath, id, img.x, img.y);
							world.havechange = true;
						}
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
						// Clear local game state for new round
						if (world != null) {
							// Remove all bomb sprites
							for (var i = 0; i < world.bombs.length; i++) {
								if (world.bombs[i]) fosfo1.undraw('bomb' + world.bombs[i].id);
							}
							world.bombs = [];

							// Remove all item sprites
							for (var i = 0; i < world.items.length; i++) {
								if (world.items[i]) fosfo1.undraw('item' + world.items[i].id);
							}
							world.items = [];

							// Remove all player sprites (they'll be re-added via PA messages)
							for (var i = 0; i < world.players.length; i++) {
								if (world.players[i]) fosfo1.undraw('player' + world.players[i].id);
							}
							world.players = [];
						}

						// Reset spectating
						isSpectating = false;

						// Reset HUD and round globals
						if (typeof HUD !== 'undefined') HUD.hideResults();
						roundWinner = null;
						roundResults = [];
						killFeed = [];
						scoreboardData = [];
					break ;
					case "E": // Round end results: RE{winnerId}|{winnerNick}|{id}|{nick}|{kills}|{deaths};{id2}|{nick2}|{kills2}|{deaths2};...
						var data = received_msg.substring(2);
						var playerEntries = data.split(";");
						var firstEntry = playerEntries[0].split("|");
						roundWinner = { id: Number(firstEntry[0]), nickname: firstEntry[1] };
						roundResults = [];
						for (var i = 0; i < playerEntries.length; i++) {
							var p = playerEntries[i].split("|");
							if (p.length >= 6) {
								// First entry: winnerId|winnerNick|playerId|playerNick|kills|deaths
								roundResults.push({ id: Number(p[2]), nickname: p[3], kills: Number(p[4]), deaths: Number(p[5]) });
							} else if (p.length >= 4) {
								// Subsequent entries: playerId|playerNick|kills|deaths
								roundResults.push({ id: Number(p[0]), nickname: p[1], kills: Number(p[2]), deaths: Number(p[3]) });
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
	});

	// ─── Room-specific events ───────────────────────────────────────────────
	socket.on('roomJoined', function(data) {
		// data = { roomId, roomName, isCreator }
		currentRoomId = data.roomId;
		currentRoomName = data.roomName;
		isRoomCreator = data.isCreator || false;
		console.log('Joined room:', data.roomName, '(creator:', isRoomCreator, ')');
	});

	socket.on('roomPlayerList', function(data) {
		// data = array of { id, nickname, skinId }
		roomPlayerList = data;
		if (typeof RoomUI !== 'undefined') RoomUI.updateWaitingRoom(data);
	});

	socket.on('roomCreatorTransfer', function() {
		isRoomCreator = true;
		console.log('You are now the room creator');
		if (typeof RoomUI !== 'undefined') RoomUI.updateWaitingRoom(roomPlayerList);
	});

	socket.on('gameStart', function() {
		// Room creator started the game - transition from waiting room to game
		if (typeof RoomUI !== 'undefined') RoomUI.hideWaitingRoom();
		document.getElementById('chat').style.display = '';
		// Initialize chat smart scroll
		if (typeof initChatScroll === 'function') initChatScroll();
		// Show room & theme HUD
		if (typeof HUD !== 'undefined' && HUD.setRoomInfo) {
			HUD.setRoomInfo(currentRoomName || '', currentTheme || 'default');
		}
		// Initialize canvas engines if not already done
		if (typeof fosfo0 === 'undefined' || !fosfo0) {
			initCanvas();
		}
		// Show loading screen and load assets, then request world data
		LoadingManager.show();
		LoadingManager.setTotal(6);
		loadGameAssets(function() {
			LoadingManager.setStatus('Loading world...');
			sendSocketMessage('WL');
			initWorld();
		});
	});

	socket.on('error', function(msg) {
		console.error('Server error:', msg);
	});

	socket.on('roomError', function(msg) {
		console.error('Room error:', msg);
		alert(msg);
	});

	socket.on('disconnect', function() {
		console.log("Socket.io disconnected");
		if (reconnectAttempt < ConnectionStatus.maxRetries) {
			ConnectionStatus.onDisconnected();
			ConnectionStatus.onRetrying(reconnectAttempt);
			reconnectAttempt++;
		} else {
			ConnectionStatus.onPermanentFailure();
		}
	});
}

function addKillToChat(killerNick, victimNick) {
	var elem = document.createElement("li");
	elem.setAttribute("class", "ng-scope kill-info");
	elem.setAttribute("data-category", "kill");
	elem.innerHTML = '<span class="ico bombed"></span> <b class="nickname">' + escapeHtml(killerNick) + '</b> killed <b class="nickname">' + escapeHtml(victimNick) + '</b>';
	var chat = document.getElementById("endchat");
	chat.parentNode.insertBefore(elem, chat);
	if (typeof ChatFilters !== 'undefined') ChatFilters.onNewMessage(elem);
	if (typeof pruneOldMessages === 'function') pruneOldMessages();
	if (typeof chatAutoScroll !== 'undefined' && chatAutoScroll) {
		var chatList = document.getElementById("listChat");
		if (chatList) chatList.scrollTop = chatList.scrollHeight;
	}
}
