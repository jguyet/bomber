var Item = function(id, templateId, x, y)
{
	this.id = id;
	this.templateId = templateId;
	this.x = Math.round(x);
	this.y = Math.round(y);
	this.skin = 1;
	this.anims = {
		'state1' : { 'frames' : [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map(() => templateId), 'size' : [16, 17, 18, 19, 20, 21, 22, 21, 20, 19, 18, 17], 'name' : 'state1', 'time' : 2000},
		// 'state2' : { 'frames' : [5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3], 'size' : [17.5, 15, 12.5, 10, 7.5, 5, 4, 5, 7.5, 10, 12.5, 15], 'name' : 'state2', 'time' : 2000},
		// 'state3' : { 'frames' : [2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0], 'size' : [17.5, 15, 12.5, 10, 7.5, 5, 4, 5, 7.5, 10, 12.5, 15], 'name' : 'state3', 'time' : 1000},
		// 'state4' : { 'rotate' : [0, 180], 'name' : 'state3'}
	};
	this.startTime = 0;
	this.currentanim = this.anims.state1;
	this.anim = 1;
	this.currentanimid = 0;
	this.fps = 1000 / 60;
	this.oldupdate = null;
	this.explo = [];
	this.exsup = 0;
	this.exleft = 0;
	this.exdown = 0;
	this.exright = 0;
	
	this.update = function()
	{
		if (this.oldupdate != null && this.getTimeUpdate() < this.fps)
			return ;
		this.resetTimeUpdate();
		// if (this.anim == 4)
		// {
		// 	this.explode();
		// 	return;
		// }
		if (this.getTime() > this.currentanim.time)
		{
			// if (this.anim == 3)
				// return ;
			// this.anim++;
			this.start();
			this.currentanim = this.anims['state' + this.anim];
		}
		if (this.currentanimid >= this.currentanim.frames.length - 1)
			this.currentanimid = -1;
		this.currentanimid++;
		this.print(this.currentanim.size[this.currentanimid]);
	};
	
	this.delete = function()
	{
		fosfo1.undraw('item' + this.id);
		world.removeitem(this);
	}
	
	this.print = function(size)
	{
		fosfo1.undraw('item' + this.id);
		fosfo1.drawframe("item" + this.id, 'assets/items/' + this.skin + '.png', this.currentanim.frames[this.currentanimid], (this.x + (size / 2)) - 6, (this.y + (size / 2)) - 11, 45 - size, 45 - size);
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