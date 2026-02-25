var World = function(data)
{
	this.width = data.split("|")[0];
	this.height = data.split("|")[1];
	this.data = [];
	this.dataimg = [];
	this.bombs = [];
	this.items = [];
	this.players = [];
	this.dup = [];
	this.havechange = false;

	this.parseMapData = function(split)
	{
		var county = 0;
		var countx = 0;
		var i = 0;
		while (county < this.height)
		{
			countx = 0;
			var tmp = [];
			while (countx < this.width)
			{
				tmp.push(split[i]);
				i++;
				countx += 1;
			}
			this.data.push(tmp);
			county += 1;
		}
	};
	
	this.updateDup = function(camX, camY, canvasW, canvasH)
	{
		var mapW = this.width * 32;
		var mapH = this.height * 32;
		this.dup = [];
		// Compute which map copies are needed to fill the entire screen.
		// Screen position = -camX + tileX + n*mapW (fosfo0.x = -camX).
		// We need n such that at least one tile in the copy is visible.
		var nXmin = Math.floor(camX / mapW);
		var nXmax = Math.floor((camX + canvasW) / mapW);
		var nYmin = Math.floor((camY - 32) / mapH);
		var nYmax = Math.floor((camY - 32 + canvasH) / mapH);
		for (var nx = nXmin; nx <= nXmax; nx++) {
			for (var ny = nYmin; ny <= nYmax; ny++) {
				if (nx === 0 && ny === 0) continue;
				this.dup.push([nx * mapW, ny * mapH]);
			}
		}
	};

	this.loadWorld = function()
	{
		fosfo0.clear();
		var mapW = parseInt(this.width);
		var mapH = parseInt(this.height);

		// Build initial dup using camera at 0,0
		this.updateDup(0, 0, layer0.width, layer0.height);

		// Create tiles for the ENTIRE map, not just the canvas viewport.
		// Tile positions are in world coordinates; fosfo0.x/y (camera offset)
		// handles scrolling them into view.
		for (var y = 0; y < mapH; y++)
		{
			var tmp = [];
			for (var x = 0; x < mapW; x++)
			{
				var c = this.data[y][x];
				var id = c.split(",")[0];
				var ground = c.split(",")[1];
				tmp.push(fosfo0.drawframe("case" + id, 'assets/maps/1.png', ground, x * 32, y * 32));
			}
			this.dataimg[y] = tmp;
		}
		fosfo0.update(this.dup);
	};
	
	this.printWorld = function()
	{
		fosfo0.clear();
		var mapW = parseInt(this.width);
		var mapH = parseInt(this.height);
		for (var y = 0; y < mapH; y++)
		{
			for (var x = 0; x < mapW; x++)
			{
				if (this.dataimg[y] != null && this.dataimg[y][x] != null)
				{
					var img = this.dataimg[y][x];
					this.dataimg[y][x] = fosfo0.drawframe(img.name, 'assets/maps/1.png', img.id, x * 32, y * 32);
				}
			}
		}
		fosfo0.update(this.dup);
	};
	
	this.getposPlayer = function(player)
	{
		var x = player.x;
		var y = player.y - (player.img.height - 20);
	}
	
	this.addplayer = function(id, x, y, dir, skin, bcurrent, nickname)
	{
		var p = new Player(id, x, y);
		p.currentanim = p.anims[dir];
		p.currentanimid = 0;
		p.skin = skin;
		p.nickname = nickname || 'Player';
		p.targetX = x;
		p.targetY = y;
		p.load();
		if (bcurrent == 1)
			currentPlayer = p;
		this.players.push(p);
	};
	
	this.moveplayer = function(id, x, y, dir, skin, bstop, bytedir, nickname)
	{
		var player = this.getPlayer(id);

		if (player == null)
		{
			this.addplayer(id, x, y, dir, skin, 0, nickname);
			return ;
		}
		// Update animation direction
		if (player.currentanim != null && player.currentanim.id != dir)
		{
			player.currentanim = player.anims[dir];
			player.currentanimid = 0;
		}
		player.skin = skin;
		if (nickname) player.nickname = nickname;

		var isLocal = (currentPlayer != null && player.id == currentPlayer.id);

		if (bstop)
		{
			// Snap to exact position on stop (both local and remote)
			player.x = x;
			player.y = y;
			player.targetX = x;
			player.targetY = y;
			player.onmove = false;
		}
		else if (isLocal)
		{
			// Local player: apply server position directly (server is authoritative)
			player.x = x;
			player.y = y;
			player.onmove = true;
		}
		else
		{
			// Remote player: set lerp target (lerp applied in updateplayers)
			player.targetX = x;
			player.targetY = y;
			player.move(); // sets onmove = true
		}
	};
	
	this.removeplayer = function(id)
	{
		var player = this.getPlayer(id);
		if (player == null)
			return ;
		this.players.splice(this.players.indexOf(player), 1);
	};
	
	this.updateplayers = function()
	{
		var LERP_FACTOR = 0.3; // 0=no movement, 1=instant snap
		_.forEach(this.players, function(value) {
			if (currentPlayer != null && value.id == currentPlayer.id)
				return ; // local player: server will send authoritative position via PM
			// Lerp remote player toward server target (replaces bytedir movement)
			if (value.targetX !== undefined)
			{
				value.x += (value.targetX - value.x) * LERP_FACTOR;
				value.y += (value.targetY - value.y) * LERP_FACTOR;
			}
			// Zero bytedir so player.update() doesn't double-move remote players
			value.bytedir = 0;
			value.update();
		});
	};
	
	this.playerExists = function(id)
	{
		for(var i = 0; i < this.players.length; i++)
		{
			if (this.players[i].id == id)
				return (true);
		}
		return (false);
	}

	this.getPlayer = function(id)
	{
		for(var i = 0; i < this.players.length; i++)
		{
			if (this.players[i].id == id)
				return (this.players[i]);
		}
		return (null);
	}
	
	this.getBomb = function(id)
	{
		for(var i = 0; i < this.bombs.length; i++)
		{
			if (this.bombs[i].id == id)
				return (this.bombs[i]);
		}
		return (null);
	}
	
	this.addbomb = function(bomb)
	{
		this.bombs.push(bomb);
	};
	
	this.removebomb = function(bomb)
	{
		this.bombs.splice(this.bombs.indexOf(bomb), 1);
	};
	
	this.updatebombs = function()
	{
		_.forEach(this.bombs, function(value) {
			if (value != null)
				value.update();
		});
	};

	this.addItem = function(id, type, cellX, cellY)
	{
		// Frame indices from 5x4 items spritesheet (assets/items/1.png)
		var frameMap = { 'fire': 3, 'bomb': 0, 'boots': 6 };
		var frameIndex = frameMap[type] !== undefined ? frameMap[type] : 0;
		fosfo1.drawframe('item' + id, 'assets/items/1.png', frameIndex, cellX * 32, cellY * 32);
		this.items.push({ id: id, type: type, cellX: cellX, cellY: cellY });
	};

	this.removeItem = function(id)
	{
		for (var i = 0; i < this.items.length; i++)
		{
			if (this.items[i].id === id)
			{
				fosfo1.undraw('item' + id);
				this.items.splice(i, 1);
				return;
			}
		}
	};

	this.createWorld = function(data)
	{
		this.parseMapData(data);
		this.loadWorld();
	};
	this.createWorld(data.split("|")[2].split(";"));
};