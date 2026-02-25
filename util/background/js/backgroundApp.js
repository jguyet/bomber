var BackgroundApp = function(canvasId, html5Id) {
	var conf = this.conf = new Conf();
	var assets = [];
	
	var fadeInTime = 800, fadeOutTime = 240;
	
	var resources, game, map, renderer;

	var canvas = $("#"+canvasId)[0];
	var html5 = $("#"+html5Id);
	$(canvas).css({display:"none"});
		
	var self = this;
	var onFadeOut = function() {
		if (canvas)
			$(canvas).fadeOut(fadeOutTime, function() {
				self.randomize();
			});
	}
	
	var onResize = function() {
		if (canvas) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			self.renderer.renderAll();
		}
	}
	
	function start() {
		for (var key in self.beforeStart)
			self.beforeStart[key](self);
		resources = self.resources = new Resources(assets, function() {
			resources.processTiles(conf);	
			if (canvas) {
				$(window).resize(onResize)
				html5.click(onFadeOut)
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				self.setup();
			}
		});
	}
		
	this.free = function() {
		html5.unbind('click', onFadeOut);
		$(window).unbind('resize', onResize);
		canvas = null;
		html5 = null;
	}
			
	this.addAssets = function(asset) {
		if (asset instanceof Array) {
			for (var i=0;i<asset.length;i++)
				assets.push(asset[i]);
		} else assets.push(asset);
	}
	
	this.addModule = function(module) {
		if (module.beforeStart)
			this.beforeStart.push(module.beforeStart);
		if (module.afterStart)
			this.afterStart.push(module.afterStart);
	}
	
	this.setup = function() {
		var canvas=$("#bg")[0];
		map = this.map = new Map(this.conf, this.defaultSave)
		game = this.game = new Game(this.map, this.conf);
		renderer = this.renderer = new Renderer(canvas, this.game, this.resources);
		this.randomize();
		$(canvas).fadeIn(fadeInTime);
	},
	
	this.randomize = function() {
		game.clearEntities();
		game.randomize(resources.entities);
		renderer.camX = Math.random()*map.width*32|0;
		renderer.camY = Math.random()*map.height*32|0;
		renderer.renderAll();
		$(canvas).fadeIn(800)
	}
		
	start();
}

BackgroundApp.addModule = function(module) {
	if (module.beforeStart)
		BackgroundApp.prototype.beforeStart.push(module.beforeStart);
	if (module.afterStart)
		BackgroundApp.prototype.afterStart.push(module.afterStart);
}

BackgroundApp.prototype = {
	beforeStart : [],
	afterStart : []
}
