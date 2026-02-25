var test = [], test2 = []
for ( var i = 0; i < 256; i++) {
	test.push(0);
	test2.push(0);
}

window.Effect = function() {
	this.buffer = document.createElement('canvas');
};

Effect.prototype.type = "effect1";

Effect.prototype.ready = function() {
	return this.progress >= 0.99;
}

// dir = -1 left, 0 center, 2 right

Effect.prototype.init0 = function(w, h, part, dir) {
	this.ww = dir == 0 ? w : 2 * w;
	this.hh = h;
	this.w = w;
	this.h = h;
	this.buffer.width = this.ww;
	this.buffer.height = this.hh;
	this.dir = 0;
	this.sx = 0;
	this.sy = 0;
	this.dir = dir;
	if (dir == -1) {
		this.sx = w;
	}
	this.wp = w / part;
	this.hp = h / part;
	this.part = part;
	return this.buffer;
}

Effect.prototype.init1 = function(x, y) {
	var context = this.buffer.getContext("2d");
	var data = context.createImageData(this.ww, this.hh);
	var orig = context.getImageData(0, 0, this.w, this.h);
	var parts = [];
	var px = [], py = [];
	var vx = [], speed = [];
	var noise = GenerateRandom(this.wp, this.hp);
	var k = 0;
	var part = this.part;
	for ( var j = this.hp - 1; j >= 0; j--) {
		for ( var i = 0; i < this.wp; i++) {
			var x0 = i * part;
			var y0 = j * part;
			var c = 0;
			for ( var dx = 0; dx < part; dx++)
				for ( var dy = 0; dy < part; dy++) {
					var t = (x0 + dx) + (y0 + dy) * this.w;
					if (orig.data[t * 4 + 3] != 0) {
						c++;
					}
				}
			var r = noise[k++]
			px.push(x0 + this.sx);
			py.push(y0);
			if (c * 2 >= part * part) {
				speed.push(1.2 * r + 0.75);
				if (r > 0.5) {
					parts.push(3);
				} else {
					parts.push(2);
				}
			} else {
				speed.push(0);
				parts.push(0);
			}
		}
	}
	this.level = [];
	for ( var i = 0; i < this.ww; i++)
		this.level.push(this.h);
	this.parts = parts;
	this.vx = vx;
	this.speed = speed;
	this.px = px;
	this.py = py;
	this.context = context;
	this.data = data;
	this.orig = orig;
	this.progress = 0.0;
	this.x = x;
	this.y = y;
	if (this.sx != 0) {
		context.drawImage(this.buffer, 0, 0, this.w, this.h, this.sx, 0,
				this.w, this.h);
		context.clearRect(0, 0, this.w, this.h);
	}
	return this;
}

Effect.prototype.init01 = function(x, y, w, h, part, dir, img, imgX, imgY,
		imgW, imgH) {
	this.init0(w, h, part, dir);
	var context = this.buffer.getContext("2d");
	context.drawImage(img, imgX, imgY, imgW, imgH, 0, 0, w, h);
	this.init1(x, y);
	return this;
}

Effect.prototype.draw = function(context, x, y, w, h) {
	if (w === undefined) {
		w = this.w;
		h = this.h;
	}
	if (this.dir == -1) {
		x -= w;
		w *= 2;
	}
	if (this.dir == 1) {
		w *= 2;
	}
	context.drawImage(this.buffer, x, y, w, h);
}

Effect.prototype.innerUpdate = function() {
	var c = 100;
	var data = this.data.data;
	var orig = this.orig.data;
	var wp = this.wp;
	var hp = this.hp;
	var part = this.part;
	var h = this.h;
	var w = this.ww;
	var k = 0;
	var w2 = this.w;

	var p = this.progress;
	var p2 = Math.min(p * p, 1.0);
	for ( var i = 0; i < 256; i++) {
		var j = i + (50 - i) * p2 | 0;
		if (j > 255)
			j = 255;
		if (j < 0)
			j = 0;
		test[i] = j;
		j = i + (255 - i) * p2 | 0;
		if (p2 > 0.7)
			j = 255 * (1.0 - p2) / 0.3 | 0
		test2[i] = j;
	}
	for ( var i = 3; i < w * h * 4; i += 4)
		data[i] = 0;
	for ( var j = hp - 1; j >= 0; j--)
		for ( var i = 0; i < wp; i++, k++)
			if (this.parts[k] != 0) {
				var p = this.progress * this.speed[k];
				var x0 = i * part;
				var y0 = j * part;
				var x = this.px[k], y = this.py[k];
				var a = 1.0;
				if (p > 0.2) {
					p = (p - 0.2) / 0.8;
					var px = p * this.dir + this.progress
							* (this.speed[k] * 10 % 0.1);
					if (this.parts[k] == 2) {
						x = x0 + this.sx + px * w / 2 | 0;
						y = y0 + p * p * this.h | 0;
					} else if (this.parts[k] == 3) {
						x = x0 + this.sx + px * w | 0;
						y = y0 + p * w / 4 | 0;
						if (this.dir == -1) {
							a = Math.min(1.0, x / w2);
						} else if (this.dir == 0) {
							a = Math.min(1.0, 1.0 - y / h);
							y = y + p * w / 2 | 0;
						} else if (this.dir == 1) {
							a = Math.min(1.0, 2.0 - x / w2);
						}
						if (y + part > h)
							this.parts[k] = 0;
					}
					if (x < 0 || x + part > w)
						this.parts[k] = 0;
				}
				if (this.parts[k] == 0)
					continue;
				var min = 0;
				if (this.parts[k] == 2) {
					var max = this.level[x]
					var num = x;
					for ( var x1 = x + 1; x1 < x + part; x1++)
						if (this.level[x1] > max) {
							num = x1;
							max = this.level[x1];
						}
					if (y + part > max) {
						y = max - part;
						x = num;
						this.level[num]--;
						this.parts[k] = 1;
					}
				}
				this.px[k] = x;
				this.py[k] = y;
				if (this.parts[k] == 3 && p > 0.2) {
					for ( var dy = 0; dy < part; dy++)
						for ( var dx = 0; dx < part; dx++) {
							var s = (x + dx) + (y + dy) * w;
							var t = (x0 + dx) + (y0 + dy) * w2;
							s *= 4;
							t *= 4;
							data[s] = test[orig[t]];
							data[s + 1] = test[orig[t + 1]];
							data[s + 2] = test[orig[t + 2]];
							data[s + 3] = a * orig[t + 3] | 0;
						}
				} else {
					for ( var dy = 0; dy < part; dy++)
						for ( var dx = 0; dx < part; dx++) {
							var s = (x + dx) + (y + dy) * w;
							var t = (x0 + dx) + (y0 + dy) * w2;
							s *= 4;
							t *= 4;
							data[s] = test[orig[t]];
							data[s + 1] = test[orig[t + 1]];
							data[s + 2] = test[orig[t + 2]];
							data[s + 3] = test2[orig[t + 3]];
						}
				}
			}
	this.context.putImageData(this.data, 0, 0);
}

Effect.prototype.update = function(progress) {
	this.progress += progress;
	this.innerUpdate();
}
