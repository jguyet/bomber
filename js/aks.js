/**
 * Socket.io client (replaces raw WebSocket connection)
 *
 * Protocol: all messages are plain strings prefixed with 2 chars [TYPE][ACTION]
 * This matches the Node.js server's socket.emit('msg', ...) / socket.on('msg', ...)
 */

// Per-player move buffer: stores latest PM data per player ID.
// Flushed once per rAF frame by flushPendingMoves() called from interval().
var pendingMoves = {};
var reconnectAttempts = 0;

function flushPendingMoves() {
	if (world == null) return;
	for (var id in pendingMoves) {
		var m = pendingMoves[id];
		world.moveplayer(Number(id), m.x, m.y, m.dir, m.skin, false, m.bytedir, m.nickname);
	}
	pendingMoves = {};
}

function sendSocketMessage(message)
{
	socket.emit('msg', message);
}

// ─── Disconnect overlay helpers ───────────────────────────────────────────────
function showDisconnectOverlay(msg, showRefresh) {
	var el = document.getElementById('disconnect-overlay');
	var msgEl = document.getElementById('disconnect-msg');
	var btn = document.getElementById('refresh-btn');
	if (el) el.style.display = 'flex';
	if (msgEl) msgEl.textContent = msg;
	if (btn) btn.style.display = showRefresh ? 'block' : 'none';
}

function hideDisconnectOverlay() {
	var el = document.getElementById('disconnect-overlay');
	if (el) el.style.display = 'none';
}

// ─── Socket initialization ────────────────────────────────────────────────────
function InitializeSocket(nickname, skinId)
{
	// Connect to the game server via socket.io (same origin, /ws path)
	socket = io({
		path: '/ws',
		transports: ['websocket']
	});

	socket.on('connect', function()
	{
		// Hide disconnect overlay on (re)connect
		hideDisconnectOverlay();
		reconnectAttempts = 0;

		// If reconnecting after a drop (world already loaded), re-send NI + WL to resync
		var nick = window._lastNickname || nickname || 'Player';
		var skin = (window._lastSkinId !== undefined) ? window._lastSkinId : (skinId || 0);

		// Send NI before WL so server knows nickname+skin before broadcasting PA
		sendSocketMessage('NI' + nick + '|' + skin);
		sendSocketMessage('WL');
		initWorld();
	});

	socket.on('msg', function (received_msg)
	{
		var type = received_msg.charAt(0);
		var action = received_msg.charAt(1);
		var fields = received_msg.substring(2).split('|');
		switch (type)
		{
			case "B":
				switch (action)
				{
					case "A":
						var id = Number(fields[0]);
						var x = Number(fields[1]);
						var y = Number(fields[2]);
						var range = Number(fields[3]);
						var bomb = new Bomb(id, x, y, range);
						bomb.start();
						world.addbomb(bomb);
					break;
					case "E":
						var id = Number(fields[0]);
						var sup = Number(fields[1]);
						var down = Number(fields[2]);
						var left = Number(fields[3]);
						var right = Number(fields[4]);
						var bomb = world.getBomb(id);
						bomb.exsup = sup;
						bomb.exleft = left;
						bomb.exdown = down;
						bomb.exright = right;
						bomb.explode();
					break;
				}
			break;
			case "M":
				switch (action)
				{
					case "N":
						addmessagetochat(received_msg.substring(2));
					break;
				}
			break;
			case "P":
				switch (action)
				{
					case "A":
						var id = Number(fields[0]);
						var x = Number(fields[1]);
						var y = Number(fields[2]);
						var dir = Number(fields[3]);
						var skin = Number(fields[4]);
						var bcurrent = Number(fields[5]);
						var nickname = fields[6] || 'Player';
						world.addplayer(id, x, y, dir, skin, bcurrent, nickname);
					break;
					case "D":
						var id = Number(fields[0]);
						world.removeplayer(id);
					break;
					case "M":
						var id = Number(fields[0]);
						var x = Number(fields[1]);
						var y = Number(fields[2]);
						var dir = Number(fields[3]);
						var skin = Number(fields[4]);
						var bytedir = Number(fields[5]);
						var nickname = fields[6] || 'Player';
						// Buffer latest position — overwrite any previous unprocessed update for this player
						pendingMoves[id] = { x: x, y: y, dir: dir, skin: skin, bytedir: bytedir, nickname: nickname };
					break;
					case "S":
						var id = Number(fields[0]);
						var x = Number(fields[1]);
						var y = Number(fields[2]);
						var dir = Number(fields[3]);
						var skin = Number(fields[4]);
						var bytedir = Number(fields[5]);
						var nickname = fields[6] || 'Player';
						// PS (stop) is always applied immediately — authoritative position snap
						world.moveplayer(id, x, y, dir, skin, true, bytedir, nickname);
						delete pendingMoves[id];
					break;
				}
			break;
			case "I":
				switch (action)
				{
					case "A": // Item Added
						var itemId = Number(fields[0]);
						var itemType = fields[1]; // 'fire', 'bomb', or 'boots'
						var cellX = Number(fields[2]);
						var cellY = Number(fields[3]);
						if (world) world.addItem(itemId, itemType, cellX, cellY);
					break;
					case "P": // Item Picked up
						var itemId = Number(fields[0]);
						var playerId = Number(fields[1]);
						if (world) world.removeItem(itemId);
					break;
				}
			break;
			case "W":
				switch (action)
				{
					case "L":
						fosfo0.clear();
						world = new World(received_msg.substring(2));
						world.loadWorld();
						// Notify loading overlay that world is ready
						if (typeof window.onWorldReady === 'function') window.onWorldReady();
					break;
					case "C":
						var ground = Number(fields[0]);
						var x = Number(fields[1]);
						var y = Number(fields[2]);
						// x, y are TILE coordinates (grid), not pixel — no camera adjustment needed
						if (world.dataimg[y] && world.dataimg[y][x]) {
							var img = world.dataimg[y][x];
							world.dataimg[y][x] = fosfo0.drawframe(img.name, 'assets/maps/1.png', ground, img.x, img.y);
							world.havechange = true;
						}
					break;
				}
			break;
		}
	});

	socket.on('disconnect', function(reason)
	{
		showDisconnectOverlay('Connection lost. Reconnecting…', false);
		reconnectAttempts = 0;
		// Socket.io handles reconnection automatically — no manual setTimeout needed
	});

	socket.on('connect_error', function()
	{
		reconnectAttempts++;
		if (reconnectAttempts < 5) {
			showDisconnectOverlay('Connection failed. Retrying (' + reconnectAttempts + '/5)…', false);
		} else {
			showDisconnectOverlay('Unable to connect. Please refresh.', true);
		}
	});
}
