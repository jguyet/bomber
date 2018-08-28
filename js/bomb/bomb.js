var Bomb = function(id, x, y, range)
{
	this.id = id;
	this.x = Math.round(x);
	this.y = Math.round(y);
	this.skin = 1;
	this.anims = {
		'state1' : { 'frames' : [8, 8, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6], 'size' : [17.5, 15, 12.5, 10, 7.5, 5, 4, 5, 7.5, 10, 12.5, 15], 'name' : 'state1', 'time' : 2000},
		'state2' : { 'frames' : [5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3], 'size' : [17.5, 15, 12.5, 10, 7.5, 5, 4, 5, 7.5, 10, 12.5, 15], 'name' : 'state2', 'time' : 2000},
		'state3' : { 'frames' : [2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0], 'size' : [17.5, 15, 12.5, 10, 7.5, 5, 4, 5, 7.5, 10, 12.5, 15], 'name' : 'state3', 'time' : 1000},
		'state4' : { 'rotate' : [0, 180], 'name' : 'state3'}
	};
	this.startTime = 0;
	this.currentanim = this.anims.state1;
	this.anim = 1;
	this.currentanimid = 0;
	this.fps = 1000 / 60;
	this.oldupdate = null;
	this.explo = [];
	this.range = range;
	this.exsup = 0;
	this.exleft = 0;
	this.exdown = 0;
	this.exright = 0;
	
	this.update = function()
	{
		if (this.oldupdate != null && this.getTimeUpdate() < this.fps)
			return ;
		this.resetTimeUpdate();
		if (this.anim == 4)
		{
			this.explode();
			return;
		}
		if (this.getTime() > this.currentanim.time)
		{
			if (this.anim == 3)
				return ;
			this.anim++;
			this.start();
			this.currentanim = this.anims['state' + this.anim];
		}
		if (this.currentanimid >= this.currentanim.frames.length)
			this.currentanimid = -1;
		this.currentanimid++;
		this.print(this.currentanim.size[this.currentanimid]);
	};
	
	this.explode = function()
	{
		this.anim = 4;
		this.currentanim = this.anims['state4'];
		this.fps = 1000 / 60;
		if (this.currentanimid > this.currentanim.rotate.length)
			this.currentanimid = -1;
		this.currentanimid++;
		if (this.explo.length == 0)
		{
			fosfo1.undraw('bomb' + this.id);
			this.explo.push(fosfo1.drawframe("explode" + this.id, 'assets/bombs/explode/1.png', 0, this.x, this.y));
			var ids = 1;
			for (var i = 1; i < this.range; i++)
			{
				if (this.exright > i)
					this.explo.push(fosfo1.drawframe("explode" + this.id + "right" + ids, 'assets/bombs/explode/1.png', 1, this.x + (i * 32), this.y, 32, 32, this.currentanim[this.currentanimid]));
				else
					this.explo.push(null);
				if (this.exleft > i)
					this.explo.push(fosfo1.drawframe("explode" + this.id + "left" + (ids + 1), 'assets/bombs/explode/1.png', 1, this.x - (i * 32), this.y, 32, 32, 180));
				else
					this.explo.push(null);
				if (this.exdown > i)
					this.explo.push(fosfo1.drawframe("explode" + this.id + "down" + (ids + 2), 'assets/bombs/explode/1.png', 1, this.x, this.y + 32 + (i * 32), 32, 32, 90));
				else
					this.explo.push(null);
				if (this.exsup > i)
					this.explo.push(fosfo1.drawframe("explode" + this.id + "up" + (ids + 3), 'assets/bombs/explode/1.png', 1, this.x + 32, this.y - (i * 32), 32, 32, 270));
				else
					this.explo.push(null);
				ids += 4;
			}
			//console.log(this.exright + " " + this.range);
			if (this.exright < this.range - 1)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "right" + ids, 'assets/bombs/explode/1.png', 1, this.x + (this.exright * 32), this.y, 32, 32, this.currentanim[this.currentanimid]));
			else if (this.exright > 0)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "right" + ids, 'assets/bombs/explode/1.png', 3, this.x + (this.exright * 32), this.y));
			else
				this.explo.push(null);
			if (this.exleft < this.range - 1)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "left" + (ids + 1), 'assets/bombs/explode/1.png', 1, this.x - (this.exleft * 32), this.y, 32, 32, 180));
			else if (this.exleft > 0)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "left" + (ids + 1), 'assets/bombs/explode/1.png', 3, this.x - (this.exleft * 32), this.y, 32, 32, 180));
			else
				this.explo.push(null);
			if (this.exdown < this.range - 1)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "down" + (ids + 2), 'assets/bombs/explode/1.png', 1, this.x, this.y + 32 + (this.exdown * 32), 32, 32, 90));
			else if (this.exdown > 0)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "down" + (ids + 2), 'assets/bombs/explode/1.png', 3, this.x, this.y + 32 + (this.exdown * 32), 32, 32, 90));
			else
				this.explo.push(null);
			if (this.exsup < this.range - 1)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "up" + (ids + 3), 'assets/bombs/explode/1.png', 1, this.x + 32, this.y - (this.exsup * 32), 32, 32, 270));
			else if (this.exsup > 0)
				this.explo.push(fosfo1.drawframe("explode" + this.id + "up" + (ids + 3), 'assets/bombs/explode/1.png', 3, this.x + 32, this.y - (this.exsup * 32), 32, 32, 270));
			else
				this.explo.push(null);
		}
		else
		{
			var dim = 3;
			this.explo[0].height -= dim;
			this.explo[0].y += (dim / 2);
			this.explo[0].width -= dim;
			this.explo[0].x += (dim / 2);
			for (var i = 1; i < this.explo.length; i += 4)
			{
				if (this.explo[i] != null)
				{
					this.explo[i].height -= dim;
					this.explo[i].y += (dim / 2);
					this.explo[i].x -= (dim / 2);
					if (i < (this.explo.length - 4))
					{
						fosfo1.undrawimg(this.explo[i]);
						this.explo[i] = fosfo1.drawframe(this.explo[i].name, 'assets/bombs/explode/1.png', 1, this.explo[i].x, this.explo[i].y, this.explo[i].width, this.explo[i].height, this.currentanim[this.currentanimid]);
					}
				}
				
				if (this.explo[i + 1] != null)
				{
					this.explo[i + 1].height -= dim;
					this.explo[i + 1].y += (dim / 2);
					this.explo[i + 1].x += (dim / 2);
					if (i < (this.explo.length - 4))
					{
						fosfo1.undrawimg(this.explo[i + 1]);
						this.explo[i + 1] = fosfo1.drawframe(this.explo[i + 1].name, 'assets/bombs/explode/1.png', 1, this.explo[i + 1].x, this.explo[i + 1].y, this.explo[i + 1].width, this.explo[i + 1].height, this.currentanim[this.currentanimid]);
					}
				}
				
				if (this.explo[i + 2] != null)
				{
					this.explo[i + 2].height -= dim;
					this.explo[i + 2].y -= (dim / 2);
					this.explo[i + 2].x += (dim / 2);
				}
				
				if (this.explo[i + 3] != null)
				{
					this.explo[i + 3].height -= dim;
					this.explo[i + 3].y += (dim / 2);
					this.explo[i + 3].x -= (dim / 2);
				}
			}
			if (this.explo[0].height <= 0)
			{
				for (var i = 0; i < this.explo.length; i++)
				{
					fosfo1.undrawimg(this.explo[i]);
				}
				world.removebomb(this);
			}
		}
	};
	
	this.print = function(size)
	{
		fosfo1.undraw('bomb' + this.id);
		fosfo1.drawframe("bomb" + this.id, 'assets/bombs/' + this.skin + '.png', this.currentanim.frames[this.currentanimid], (this.x + (size / 2)) - 6, (this.y + (size / 2)) - 11, 45 - size, 45 - size);
	}
	
	this.getTimeUpdate = function()
	{
		var d = new Date();
		var t = d.getTime();
		return (t - this.oldupdate);
	}
	
	this.resetTimeUpdate = function()
	{
		var d = new Date();
		this.oldupdate = d.getTime();
	}
	
	this.getTime = function()
	{
		var d = new Date();
		var t = d.getTime();
		return (t - this.startTime);
	}
	
	this.start = function()
	{
		var d = new Date();
		this.startTime = d.getTime();
	};
}