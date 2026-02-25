var Player = function(id, x, y)
{
	this.id = id;
	this.skin = 1;
	this.x = x;
	this.y = y;
	this.speed = 1.5;
	this.nickname = "Player";
	this.anims = [
		{'frames' : [0, 1, 2, 3], 'name' : 'up', 'id' : 0},
		{ 'frames' : [4, 5, 6, 7], 'name' : 'right', 'id' : 1},
		{ 'frames' : [8, 9, 10, 11], 'name' : 'down', 'id' : 2},
		{ 'frames' : [12, 13, 14, 15], 'name' : 'left', 'id' : 3}
	];
	this.currentanim = null;
	this.currentanimid = 0;
	this.nmoveanim = 0;
	this.onmove = false;
	this.img = null;
	this.lastRefreshTime = (new Date()).getTime();
	this.bytedir = 0;
	this.alive = true;
	
	this.update = function()
	{
		if (!this.alive) {
			this.remove();
			return ;
		}
		let now = (new Date()).getTime(); // Temps actuel
		let deltaTime = (now - this.lastRefreshTime) / (1000 / 60); // Temps écoulé en secondes
		this.lastRefreshTime = now;

		if (this.currentanimid >= this.currentanim.frames.length || !this.onmove) {
			this.currentanimid = 0;
		}

		if (this.onmove) {
			let speedForMove = this.speed;
			if (this.bytedir & 16 && this.bytedir != 16 || this.bytedir & 4 && this.bytedir != 4 || this.bytedir & 32 && this.bytedir != 32 || this.bytedir & 8 && this.bytedir != 8) {
				speedForMove *= 0.9;
			}
			let speed = deltaTime * speedForMove; // Le déplacement basé sur le temps écoulé

			if ((this.bytedir & 4) != 0) {
				let c = this.getposibleCell(0.0, -speed);
				while (c === undefined || c.split(",")[0] != 0) {
					speed -= 0.1;
					if (speed <= 0) {
						break ;
					}
					c = this.getposibleCell(0.0, -speed);
				}
				if (speed > 0) {
					this.y -= speed;
				}
			}

			if ((this.bytedir & 16) != 0) {
				let c = this.getposibleCell(0.0, speed);
				while (c === undefined || c.split(",")[0] != 0) {
					speed -= 0.1;
					if (speed <= 0) {
						break ;
					}
					c = this.getposibleCell(0.0, speed);
				}
				if (speed > 0) {
					this.y += speed;
				}
			}

			if ((this.bytedir & 32) != 0) {
				let c = this.getposibleCell(-speed, 0.0);
				while (c === undefined || c.split(",")[0] != 0) {
					speed -= 0.1;
					if (speed <= 0) {
						break ;
					}
					c = this.getposibleCell(-speed, 0.0);
				}
				if (speed > 0) {
					this.x -= speed;
				}
			}

			if ((this.bytedir & 8) != 0) {
				let c = this.getposibleCell(speed, 0.0);
				while (c === undefined || c.split(",")[0] != 0) {
					speed -= 0.1;
					if (speed <= 0) {
						break ;
					}
					c = this.getposibleCell(speed, 0.0);
				}
				if (speed > 0) {
					this.x += speed;
				}
			}

			if (this.x < 0) {
				this.x = (world.width * 32) - (-this.x);
			}
			if (this.y < 0) {
				this.y = (world.height * 32) - (-this.y);
			}
		}

		this.print();

		if (this.nmoveanim > 8) {
			this.nmoveanim = 0;
			this.currentanimid++;
		}
		this.nmoveanim++;
	};

	
	this.print = function()
	{
		fosfo1.undraw('player' + this.id);
		//////////////////////////////////////////////
		// MAP MOVE MODE (Disable for normal mode)
		//////////////////////////////////////////////
		if (this.id == currentPlayer.id) {

			let tileSize = 32;
			let worldWidthPxs = (world.width * tileSize);
			let worldHeightPxs = (world.height * tileSize);
			let baseX = (((window.innerWidth / SIZE) - worldWidthPxs) / 2);
			let baseY = (((window.innerHeight / SIZE) - worldHeightPxs) / 2);
			let middleWorldWidth = (worldWidthPxs / 2);
			let middleWorldHeight = (worldHeightPxs / 2);
			fosfo0.x = ((baseX + middleWorldWidth) - ((currentPlayer.x) % worldWidthPxs));
			fosfo1.x = ((baseX + middleWorldWidth) - ((currentPlayer.x) % worldWidthPxs));
			fosfo0.y = ((baseY + middleWorldHeight) - ((currentPlayer.y) % worldHeightPxs));
			fosfo1.y = ((baseY + middleWorldHeight) - ((currentPlayer.y) % worldHeightPxs));

			// [fosfo0, fosfo1].forEach(f => {
			// 	f.x = ((baseX + middleWorldWidth) - ((currentPlayer.x) % worldWidthPxs));
			// 	f.y = ((baseY + middleWorldHeight) - ((currentPlayer.y) % worldHeightPxs));
			// });
			// fosfo1.undraw('test1');
			// fosfo1.undraw('test2');
			// fosfo1.undraw('test3');
			// fosfo1.undraw('test4');
			// fosfo1.draw('test1', 'assets/red-pixel.png', this.x + this.speed + 12, this.y);
			// fosfo1.draw('test2', 'assets/red-pixel.png', this.x - this.speed, this.y);
			// fosfo1.draw('test3', 'assets/red-pixel.png', this.x, this.y - this.speed);
			// fosfo1.draw('test4', 'assets/red-pixel.png', this.x, this.y + this.speed + 2);
		}
		//////////////////////////////////////////////
		fosfo1.drawframe3("player" + this.id, 'assets/characters/' + this.skin + '.png', this.currentanim.frames[this.currentanimid], (this.x % (world.width * 32)) - (this.img.width / 2), (this.y % (world.height * 32)) - (this.img.height - 5));
	}

	this.remove = function()
	{
		fosfo1.undraw('player' + this.id);
	}
	
	this.move = function()
	{
		this.onmove = true;
	}
	
	this.sendpos = function()
	{
		sendSocketMessage("PM1|" + this.x + "|" + this.y + "|" + this.currentanim.name + "|" + this.currentanimid);
	}
	
	this.getpos = function()
	{
		return ({x: Math.round((Math.round(this.x) / 32) % world.width), y: Math.round((Math.round(this.y) / 32) % world.height)});
	}
	
	this.load = function()
	{
		fosfo1.loadimage('assets/characters/' + this.skin + '.png');
		var img = fosfo1.setFramesToImg('assets/characters/' + this.skin + '.png', 4, 4);
		this.img = img; 
	};
	
	this.load2 = function()
	{
		fosfo1.loadimage('assets/characters/' + this.skin + '.png');
		var img = fosfo1.setFramesToImg('assets/characters/' + this.skin + '.png', 4, 4);
		this.img = img; 
	};

	this.getCurCell = function()
	{
		return (this.getposibleCell(0, 0));
	}

	this.getposibleCell = function(x2, y2)
	{
		return (world.getCellPos(this.x + x2, this.y + y2));
	}

	this.hasBombOnTargetCell = function(x2, y2)
	{
		return (world.hasBombOnCell(this.x + x2, this.y + y2));
	}
};