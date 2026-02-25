var Player = function(id, x, y)
{
	this.id = id;
	this.skin = 1;
	this.x = x;
	this.y = y;
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
		if (!this.onmove)
		{
			this.currentanimid = 0;
		}
		if (this.onmove)
		{
			this.nmoveanim++;
			if (this.nmoveanim > 8)
			{
				this.nmoveanim = 0;
				this.currentanimid++;
			}
			if (this.currentanimid >= this.currentanim.frames.length)
				this.currentanimid = 0;
		}
		this.print();
	};
	
	this.print = function()
	{
		fosfo1.undraw('player' + this.id);
		// Sprite (42x42) centered on hitbox (28x28): offset = (28-42)/2 = -7
		// Vertically: align sprite bottom with hitbox bottom: offset = 28-42 = -14
		var frameW = this.img.image.width / this.img.fw;
		var frameH = this.img.image.height / this.img.fh;
		var offsetX = (28 - frameW) / 2;   // -7 for 42px sprite
		var offsetY = 28 - frameH;         // -14 for 42px sprite (feet at hitbox bottom)
		fosfo1.drawframe("player" + this.id, 'assets/characters/' + this.skin + '.png', this.currentanim.frames[this.currentanimid], this.x + offsetX, this.y + offsetY);
	}
	
	this.move = function()
	{
		this.onmove = true;
	}
	
	this.getpos = function()
	{
		// Double-modulo handles negative coords: JS % can return negative values,
		// so (v % size + size) % size always yields a positive result.
		var gx = Math.round(this.x) / 32;
		var gy = Math.round(this.y) / 32;
		var w = parseInt(world.width);
		var h = parseInt(world.height);
		return ({x: ((gx % w) + w) % w, y: ((gy % h) + h) % h});
	}
	
	this.load = function()
	{
		fosfo1.loadimage('assets/characters/' + this.skin + '.png');
		var img = fosfo1.setFramesToImg('assets/characters/' + this.skin + '.png', 4, 4);
		this.img = img; 
	};
	
};