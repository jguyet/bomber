var Player = function(id, x, y)
{
	this.id = id;
	this.skin = 1;
	this.x = x;
	this.y = y;
	this.speed = 1.5;
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
	this.startTime = 0;
	this.bytedir = 0;
	
	this.update = function()
	{
		if (this.currentanimid >= this.currentanim.frames.length || !this.onmove)
			this.currentanimid = 0;
		if (this.onmove)
		{
			if ((this.bytedir & 4) != 0)
				this.y -= this.speed;
			if ((this.bytedir & 8) != 0)
				this.x += this.speed;
			if ((this.bytedir & 16) != 0)
				this.y += this.speed;
			if ((this.bytedir & 32) != 0)
				this.x -= this.speed;
		}
		this.print();
		if (this.nmoveanim > 8)
		{
			this.nmoveanim = 0;
			this.currentanimid++;
		}
		this.nmoveanim++;
	};
	
	this.print = function()
	{
		fosfo1.undraw('player' + this.id);
		fosfo1.drawframe("player" + this.id, 'assets/characters/' + this.skin + '.png', this.currentanim.frames[this.currentanimid], this.x, this.y - (this.img.height - 20));
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
};