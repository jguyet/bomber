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

	this.setDup = function() {
		this.dup = [];
		
		let x = (currentPlayer.x % (this.width * 32));
		let y = (currentPlayer.y % (this.height * 32));
		if (x < (this.width * 32) / 2 && y < (this.height * 32) / 2) { // top left
			this.dup.push([-(this.width * 32), 0]); // left
			this.dup.push([0, -(this.height * 32)]); // top
			this.dup.push([-(this.width * 32), -(this.height * 32)]); // top left
		}
		if (x > (this.width * 32) / 2 && y < (this.height * 32) / 2) { // top right
			this.dup.push([0, -(this.height * 32)]); // top
			this.dup.push([(this.width * 32), 0]); // right
			this.dup.push([(this.width * 32), -(this.height * 32)]); // top right
		}
		if (x < (this.width * 32) / 2 && y > (this.height * 32) / 2) { // bottom left
			this.dup.push([-(this.width * 32), 0]); // left
			this.dup.push([0, (this.height * 32)]); // bottom
			this.dup.push([-(this.width * 32), (this.height * 32)]); // bottom left
		}
		if (x > (this.width * 32) / 2 && y > (this.height * 32) / 2) { // bottom right
			this.dup.push([(this.width * 32), 0]); // right
			this.dup.push([0, (this.height * 32)]); // bottom
			this.dup.push([(this.width * 32), (this.height * 32)]); // bottom right
		}
	}
	
	this.loadWorld = function()
	{
		fosfo0.clear();
		let county = 0;
		let countx = 0;
		var y = 0;
		var x = 0;
		var first = true;
		var noput = false;
		// this.dup.push([-(this.width * 32), 0]); // left
		// this.dup.push([0, -(this.height * 32)]); // top
		// this.dup.push([(this.width * 32), 0]); // right
		// this.dup.push([0, (this.height * 32)]); // bottom

		// this.dup.push([-(this.width * 32), (this.height * 32)]); // bottom left
		// this.dup.push([(this.width * 32), (this.height * 32)]); // bottom right
		// this.dup.push([-(this.width * 32), -(this.height * 32)]); // top left
		// this.dup.push([(this.width * 32), -(this.height * 32)]); // top right

		while (county < (this.height * 32))
		{
			countx = 0;
			x = 0;
			var tmp = [];
			while (countx < (this.width * 32))
			{
				var c = this.data[y % this.height][x % this.width];
				
				var id = c.split(",")[0];
				var groundId = c.split(",")[1];

				tmp.push(fosfo0.drawframe("case" + id, 'assets/maps/1.png', groundId, countx, county));

				if ((y % this.height) == 0 && (x % this.width) == 0)
				{
					first = false;
				}
				countx += 32;
				x++;
			}
			this.dataimg[y] = tmp;
			y++;
			county += 32;
		}
		fosfo0.update(this.dup);
	};
	
	// this.printWorld = function()
	// {
	// 	fosfo0.clear();
	// 	var county = 0;
	// 	var countx = 0;
	// 	var y = 0;
	// 	var x = 0;
	// 	while (county < layer0.height)
	// 	{
	// 		countx = 0;
	// 		x = 0;
	// 		while (countx < layer0.width)
	// 		{
	// 			var c = this.data[y % this.height][x % this.width];
				
	// 			if (y > -1 && x > -1 && this.dataimg[y] != null && this.dataimg[x] != null)
	// 			{
	// 				var img = this.dataimg[y][x];
	// 				// this.dataimg[y][x] = fosfo0.drawframe(img.name, 'assets/maps/1.png', img.id, countx, county);
	// 				this.dataimg[y][x] = fosfo0.drawframe2(img.name, 'assets/maps/1.png', img.id, countx, county, 1.0 + (SIZE / 10), 1.0 + (SIZE / 10));
	// 			}
	// 			countx += 32;
	// 			x++;
	// 		}
	// 		y++;
	// 		county += 32;
	// 	}
	// 	fosfo0.update(this.dup);
	// };
	
	this.getposPlayer = function(player)
	{
		var x = player.x;
		var y = player.y - (player.img.height - 20);
	}
	
	this.addplayer = function(id, x, y, dir, skin, speed, bcurrent, nickname)
	{
		var p = new Player(id, x, y);
		p.currentanim = p.anims[dir];
		p.currentanimid = 0;
		p.skin = skin;
		p.speed = speed;
		p.nickname = nickname || "Player";
		p.load();
		if (bcurrent == 1)
			currentPlayer = p;
		this.players.push(p);
	};

	this.setPlayerSpeed = function(id, speed)
	{
		var player = this.getPlayer(id);
		if (player != null)
		{
			player.speed = speed;
		}
	}
	
	this.moveplayer = function(id, x, y, dir, skin, bstop, bytedir, nickname)
	{
		var player = this.getPlayer(id);

		if (player == null)
		{
			this.addplayer(id, x, y, dir, skin, 0, 0, nickname);
			return ;
		}
		if (nickname && nickname.length > 0) player.nickname = nickname;
		if (player.currentanim != null && player.currentanim.id != dir)
		{
			player.currentanim = player.anims[dir];
			player.currentanimid = 0;
		}
		player.x = x;
		player.y = y;
		player.skin = skin;
		player.bytedir = bytedir;
		if (bytedir != 0)
			player.move();
		else
			player.onmove = false;
	};
	
	this.removeplayer = function(id)
	{
		var player = this.getPlayer(id);
		if (player != null) {
			fosfo1.undraw('player' + player.id);
			this.players.splice(this.players.indexOf(player), 1);
		}
	};
	
	this.updateplayers = function()
	{
		_.forEach(this.players, function(value) {
			if (currentPlayer != null && value.id == currentPlayer.id)
				return ;
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

	this.getItem = function(id)
	{
		for(var i = 0; i < this.items.length; i++)
		{
			if (this.items[i].id == id)
				return (this.items[i]);
		}
		return (null);
	}

	this.additem = function(item)
	{
		this.items.push(item);
	};
	
	this.removeitem = function(item)
	{
		this.items.splice(this.items.indexOf(item), 1);
	};
	
	this.updateitems = function()
	{
		_.forEach(this.items, function(value) {
			if (value != null)
				value.update();
		});
	};
	
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