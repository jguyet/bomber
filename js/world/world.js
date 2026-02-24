var World = function(data)
{
	this.width = data.split("|")[0];
	this.height = data.split("|")[1];
	this.data = [];
	this.dataimg = [];
	this.bombs = [];
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
	
	this.loadWorld = function()
	{
		fosfo0.clear();
		var county = 0;
		var countx = 0;
		var y = 0;
		var x = 0;

		var mapW = this.width * 32;
		var mapH = this.height * 32;
		var canvasW = layer0.width;
		var canvasH = layer0.height;

		// Rebuild dup: all tile offsets that cover the canvas, including left of fosfo0.x offset
		this.dup = [];
		var offsetX = fosfo0 ? fosfo0.x : 0;
		var startOx = -Math.ceil(offsetX / mapW) * mapW;
		for (var ox = startOx; ox < canvasW; ox += mapW)
		{
			for (var oy = 0; oy < canvasH; oy += mapH)
			{
				if (ox !== 0 || oy !== 0)
					this.dup.push([ox, oy]);
			}
		}

		while (county < canvasH)
		{
			countx = 0;
			x = 0;
			var tmp = [];
			while (countx < canvasW)
			{
				var c = this.data[y % this.height][x % this.width];
				var id = c.split(",")[0];
				var ground = c.split(",")[1];
				tmp.push(fosfo0.drawframe("case" + id, 'assets/maps/1.png', ground, countx, county));
				countx += 32;
				x++;
			}
			this.dataimg[y] = tmp;
			y++;
			county += 32;
		}
		fosfo0.update(this.dup);
	};
	
	this.printWorld = function()
	{
		fosfo0.clear();
		var county = 0;
		var countx = 0;
		var y = 0;
		var x = 0;
		while (county < layer0.height)
		{
			countx = 0;
			x = 0;
			while (countx < layer0.width)
			{
				if (this.dataimg[y] != null && this.dataimg[y][x] != null)
				{
					var img = this.dataimg[y][x];
					this.dataimg[y][x] = fosfo0.drawframe(img.name, 'assets/maps/1.png', img.id, countx, county);
				}
				countx += 32;
				x++;
			}
			y++;
			county += 32;
		}
		fosfo0.update(this.dup);
	};
	
	this.getposPlayer = function(player)
	{
		var x = player.x;
		var y = player.y - (player.img.height - 20);
	}
	
	this.addplayer = function(id, x, y, dir, skin, bcurrent)
	{
		var p = new Player(id, x, y);
		p.currentanim = p.anims[dir];
		p.currentanimid = 0;
		p.skin = skin;
		p.targetX = x;
		p.targetY = y;
		p.load();
		if (bcurrent == 1)
			currentPlayer = p;
		this.players.push(p);
	};
	
	this.moveplayer = function(id, x, y, dir, skin, bstop, bytedir)
	{
		var player = this.getPlayer(id);

		if (player == null)
		{
			this.addplayer(id, x, y, dir, skin, 0);
			return ;
		}
		// Update animation direction
		if (player.currentanim != null && player.currentanim.id != dir)
		{
			player.currentanim = player.anims[dir];
			player.currentanimid = 0;
		}
		player.skin = skin;

		if (bstop)
		{
			// On stop: snap to exact server position
			player.x = x;
			player.y = y;
			player.targetX = x;
			player.targetY = y;
			player.onmove = false;
		}
		else
		{
			// On move: set target, interpolate in updateplayers()
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

	this.createWorld = function(data)
	{
		this.parseMapData(data);
		this.loadWorld();
	};
	this.createWorld(data.split("|")[2].split(";"));
};