(function(exports) {

	function withVersion(sprite, src) {
		if (sprite.hasOwnProperty("version"))
			src += "?ver="+sprite.version;
		return src;
	}
	
	var Texture = function() {
	}

	Texture.prototype = {
		element : null,
		src : null,
		glTex : null,
		glModified : false,
		glRepeat : false,
		glLevel : 0,
		pattern2d : null,
		width : 0,
		height : 0
	}

	var Sprite = function() {
		this.childs = null
		this.childIdxByName = null
	}

	Sprite.prototype = {
		name : null,
		src : null,
		texture : null,
		loaded : false,
		group : false,
		flag : false,
		renderShiftX : 0,
		renderShiftY : 0,
		colors : 0,
		glLevel : 0,
		glRepeat : false,
		skin : null,
		x : 0,
		y : 0,
		styleX : 0,
		styleY : 0,
		frames : null,

		frameWidth : 32,
		frameHeight : null,
		renderWidth : null,
		renderHeight : null,
		// for dynamic skins table
		index : 0
	}
	
	var Skin = function(skin) {
		for(var key in skin)
			if (skin.hasOwnProperty(key))
				this[key] = skin[key];
				
		if (this.animCount == 3 && !this.animCountSide) {
			// in every known skin with 3 columns has this configuration
			// if it is different, use col = [0, 1, 2] instead
			this.col = [0, 1, 2, 1];
			this.colStand = 1;
		} 
		this.idleAnimSpeed = this.idleAnimSpeed
				|| this.animSpeed * (this.alwaysRun ? 2 : 1);
		this.frameHeight = this.frameHeight || this.frameWidth;
		this.renderWidth = this.renderWidth || this.frameWidth;
		this.renderHeight = this.renderHeight
				|| (this.renderWidth * this.frameHeight / this.frameWidth);
		this.soulWidth = this.soulWidth || this.frameWidth;
		if (this.col)
			this.animCount = this.col.length;
		this.animCountSide = this.animCountSide || this.animCount;
		if (this.idleCol)
			this.idleAnimCount = this.idleCol.length;
		this.idleAnimCount = this.idleAnimCount || this.animCount;
		this.idleAnimCountSide = this.idleAnimCountSide
				|| (this.alwaysRun ? this.animCountSide : this.idleAnimCount);
	}

	Skin.prototype = {
		frameWidth : 32,
		renderWidth : null,
		soulWidth : null,
		publicSkin : false,
		animCount : 4,
		animMirrorLeft : false,
		animStand : false,
		idleAnim : false,
		idlePauseAfterMoving: true,
		alwaysRun : false,
		alwaysOnTop : false,
		hasSoul : false,
		colorMode : 0,
		colStand : 0,
		animSpeed : 1200,
		rolls: false
	}

	/**
	 * @constructor
	 */
	var Sprites = function() {
		var noop = function() {
		};
		this._static = {};
		this._dynamic = {};
		this._alias = {};
		this._dynlist = [];
		this.byGroup = {};
		//this.byShopGroup = {};
		this.onProgress = noop;
		this.onComplete = noop;
		this.onError = noop;
		this.onLoad = noop;
		this.onAdd = noop;
		this.staticMagic = 0;
		this.staticURL = "img/";
		this.constructorPath = "/ctor/";
		this.dynamicURL = "img/skins/"
		this.skinList = "sprites.json";
		this.progress = 0;
		this.total = 0;
		this.state = 0;
		this.dynamicIndex = 0;
		this.asyncLoaded = 0;
		this.ctorData = null;
		this.skinBuilder = null;
		// unloading
		this.unloadAfter = 1000 * 60 * 20; // unload skins after this time
		this.unloadAfterAgressive = 1000 * 30;
		this.unloadAgressiveCount = 300;
		this.unloadInterval = 1000 * 30; // how often check sprites to unload
		this.debugSkinStatus = "";
		this.debugTotalUnloaded = 0;
		this.lastUnloadTime = Date.now();
		// shop thmbs
		this.shopThumbSize = 72;
		this.assetsConfig = {};
	};

	// state 0 : config is loading..
	// state 1 : config loaded
	// state 2 : resources loaded
	// state 3 : fatal error while loading resources
	
	Sprites.prototype._getDynamic = function(name) {
		var sprite = this._dynamic[name];
		if (sprite)
			sprite.lastAccessTime = Date.now();
		this._unloadOldDynamic(); // check periodically
		return sprite;
	};
	
	Sprites.prototype._unloadOldDynamic = function() {
		// don't check all sprites too often
		var now = Date.now();
		if (now - this.lastUnloadTime < this.unloadInterval)
			return;
		this.lastUnloadTime = now;
		
		// remove agressively?
		var loadedCount = 0;
		for(var name in this._dynamic) {
			if (this._dynamic[name].loaded)
				loadedCount++;
		}
		var unloadAfter = loadedCount < this.unloadAgressiveCount
			? this.unloadAfter : this.unloadAfterAgressive;
		
		var unloadedCount = 0;
		for(var name in this._dynamic) {
			var sprite = this._dynamic[name];
			if (sprite.loaded && now - sprite.lastAccessTime > unloadAfter) {
				//console.log("Sprites.prototype._unloadOldDynamic " + name);
				unloadedCount++;
				// an instance of this sprite referenced by the client won't change
				if (name[0] == "!" || name[0] == "?") {
					// remove constructor skins completely
					delete this._dynamic[name];
				}else {
					// create a copy of the sprite without a texture
					var newSprite = {};
					for (var key in sprite)	{
						if (sprite.hasOwnProperty(key))
							newSprite[key] = sprite[key];
					}
					newSprite.loaded = false;
					newSprite.texture = null;
					this._dynamic[name] = newSprite;
					if (typeof sprite.index == "number")
						this._dynlist[sprite.index] = newSprite;
				}
			}
		}
		this.debugTotalUnloaded += unloadedCount;
		this.debugSkinStatus = "last time: loaded=" + loadedCount + ", unloaded=" + unloadedCount
			+ "; all-time: unloaded=" + this.debugTotalUnloaded;
	};
	
	Sprites.prototype.get = function(name) {
		var self = this;
		if (this._static[name])
			return this._static[name];
		if (name.length>0 && (name[0] == '!' || name[0]=='?') && this.skinBuilder) {
			var sprite = this._getDynamic(name);
			if (sprite) return sprite;
			sprite = (this._dynamic[name] = {name: name, loaded: false, skin: {}, texture: {} })
			console.log("skinBuilder.build " + sprite.name);
			this.skinBuilder.build( {name: sprite.name}, function(result) {
				if (result.canvas)
					self.addSpriteWithCanvas(result.canvas, result.skin);
				else
					console.log("skinBuilder.onError " + result.skin.name);
			});
		}
		return this._getDynamic(name);
	};
	
	Sprites.prototype.loadStatic = function(callback) {
		if (callback)
			this.onComplete = callback;
		else
			this.onComplete = this.noop;
				
		this.state = 1;
		var self = this;
		for ( var name in this._static) {
			var sprite = this._static[name];
			if (sprite.texture && sprite.texture.element.src == '') {
				this.total++;
				sprite.texture.element.src = withVersion(sprite, sprite.texture.src);
			}
			if (sprite.spine) {
				spine.Bone.yDown = true;
				sprite.spine.element = sprite.texture.element;
				
				function loadAtlas(sprite) {
					if (!sprite.spine.atlasSrc) return;
					if (sprite.spine.atlas) return;
					self.total++;
					self.atlas = {};
					$.ajax({
						url: sprite.spine.atlasSrc,
						success : function(data) {
							sprite.spine.atlas = new spine.Atlas(data, { load: function() {} });
							self.progress++;
							loadSkeleton(sprite);
						}
					})
				}
				
				function loadSkeleton(sprite) {
					if (!sprite.spine.skeletonSrc) return;
					if (sprite.spine.skeleton) return;
					sprite.spine.skeleton = {};
					self.total++;
					$.ajax({
						url: sprite.spine.skeletonSrc,
						success : function(data) {
							var sk = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(sprite.spine.atlas));
							sprite.spine.skeleton = sk.readSkeletonData(data, sprite.name);
							sprite.spine.animation = new spine.AnimationStateData(sprite.spine.skeleton);
							self.progress++;
							self.onProgress(self.progress, self.total, sprite.name+"-skeleton");
							if (self.state == 1 && self.progress == self.total) {
								self.state = 2;
								self.onComplete();
							}
						}
					})
				}
				
				loadAtlas(sprite);
			}
		}
		if (self.progress == self.total) {
			self.state = 2;
			self.onComplete();
		}
	}

	Sprites.prototype.demand = function(name) {
		var self = this;
		var sprite = this._static[name];
		if (sprite) {
			sprite.texture.element.src = withVersion(sprite, sprite.texture.src);
			return;
		}
		sprite = this._getDynamic(name);
		if (!sprite || sprite.texture)
			return;
		sprite.texture = new Texture();
		sprite.texture.glRepeat = sprite.glRepeat;
		sprite.texture.glLevel = sprite.glLevel;
		sprite.texture.src = sprite.src;
		var element = sprite.texture.element = new Image();
		element.title = sprite.name;
		element.onload = function() {
			sprite.texture.width = element.width;
			sprite.texture.height = element.height;
			self._dynamic[this.title].loaded = true;
			self.onLoad(this.title);
		}
		element.src = withVersion(sprite, sprite.src)
	}
	
	Sprites.prototype.addSpriteWithCanvas = function(canvas, thing) {
		var sprite = this._createSprite(thing);
		this._prepareSprite(sprite);
		this._dynamic[sprite.name] = sprite;
		sprite.texture = new Texture();
		sprite.texture.glRepeat = sprite.glRepeat;
		sprite.texture.glLevel = sprite.glLevel;
		sprite.texture.src = sprite.src;
		sprite.texture.element = canvas;
		sprite.texture.width = canvas.width;
		sprite.texture.height = canvas.height;
		sprite.loaded = true;
		this.onLoad(sprite.name);
	}
	
	Sprites.prototype._loadStatic = function(sprite) {
		sprite.texture = new Texture();
		sprite.texture.glRepeat = sprite.glRepeat;
		sprite.texture.glLevel = sprite.glLevel;
		sprite.path = sprite.path || "";
		if (!sprite.src) {
			sprite.filename = sprite.filename || (sprite.name + ".png")
			sprite.texture.src = this.staticURL + sprite.path + sprite.filename;
		} else
			sprite.texture.src = sprite.src; 
		if (sprite.spine) {
			sprite.spine.atlasFilename = sprite.spine.atlasFilename || (sprite.name + ".atlas");
			sprite.spine.atlasSrc = this.staticURL + sprite.path + sprite.spine.atlasFilename;
			sprite.spine.skeletonFilename = sprite.spine.skeletonFilename || (sprite.name + ".json");
			sprite.spine.skeletonSrc = this.staticURL + sprite.path + sprite.spine.skeletonFilename;
		}
		var self = this;
		sprite.magic = self.staticMagic;
		var element = sprite.texture.element = new Image();
		element.title = sprite.name;
		element.onload = function() {
			var sprite = self._static[this.title];
			if (sprite == null || self.staticMagic != sprite.magic)
				return;
			sprite.texture.width = element.width;
			sprite.texture.height = element.height;
			sprite.loaded = true;
			self.lastLoaded = this.title;
			++self.progress;
			self.onLoad(this.title);
			self.onProgress(self.progress, self.total, this.title);
			if (self.state == 1 && self.progress == self.total) {
				self.state = 2;
				self.onComplete();
			}
		};
		element.onerror = function(e) {
			var sprite = self._static[this.title];
			if (sprite == null || self.staticMagic != sprite.magic)
				return;
			self.err = this.title;
			if (self.state == 1) {
				self.state = 3;
				self.onError(this.title);
			}
		};
	}

	Sprites.prototype._addSprite = function(sprite) {
		this._static[sprite.name] = sprite;
		if (!sprite.texture) {
			if (sprite.atlas) {
				sprite.texture = this._static[sprite.atlas].texture;
			} else {
				this._loadStatic(sprite);
			}
		}
	}

	Sprites.prototype._createSprite = function(thing) {
		var sprite = new Sprite();
		for (var id in thing)
			if (thing.hasOwnProperty(id))
				sprite[id] = thing[id];
		if (thing.hasOwnProperty("skin"))
			sprite.skin = new Skin(thing.skin);
		return sprite;
	}

	Sprites.prototype._prepareSprite = function(target) {
		if (target.frames) {
			target.x = target.frames[0].x;
			target.y = target.frames[0].y;
		}
		if (target.skin) {
			var ts = target.skin; 
			target.frameWidth   = ts.frameWidth;
			target.frameHeight  = ts.frameHeight;
			target.renderWidth  = ts.renderWidth;
			target.renderHeight = ts.renderHeight;
			target.renderShiftX = ts.renderShiftX || target.renderShiftX;
			target.renderShiftY = (ts.renderShiftY || target.renderShiftY) - 4;
		} else {
			target.frameWidth = target.frameWidth || 32;
			target.frameHeight = target.frameHeight || target.frameWidth;
			target.renderWidth = target.renderWidth || target.frameWidth;
			target.renderHeight = target.renderHeight
					|| (target.renderWidth * target.frameHeight / target.frameWidth);
		}
		// Special for getStyle
		target.styleX = target.x;
		target.styleY = target.y;
	}
	
	Sprites.prototype.add = function(thing) {
		if (thing instanceof Array) {
			for ( var i = 0; i < thing.length; i++)
				this.add(thing[i]);
			return;
		}
		var sprite = this._createSprite(thing);
		this._prepareSprite(sprite);
		this._addSprite(sprite);
		if (sprite.group && sprite.rows) {
			sprite.childs = []
			sprite.childIdxByName = {}
			var table = sprite.rows;
			for ( var i = 0; i < table.length; i++) {
				var row = table[i];
				var xx = sprite.x;
				for ( var j = 0; j < table[i].length; j++) {
					var cell = table[i][j];
					if (typeof cell === "string") {
						if (cell == "") {
							xx += sprite.frameWidth;
							continue;
						}
						cell = {
							name : cell
						}
					}
					if (cell.hasOwnProperty("col"))
						xx = sprite.x + cell.col * sprite.frameWidth;
					cell.x = xx;
					cell.y = sprite.y + i * sprite.frameHeight;
					// special for getStyle
					if (cell.frameCount) {
						cell.frames = [];
						for ( var k = 0; k < cell.frameCount; k++) {
							cell.frames.push({
								x : xx,
								y : cell.y
							})
							xx += sprite.frameWidth;
						}
					} else {
						xx += sprite.frameWidth;
					}
					var spriteInCell = this._createSprite(cell);
					for ( var key in sprite)
						if (sprite.hasOwnProperty(key)
								&& !spriteInCell.hasOwnProperty(key))
							spriteInCell[key] = sprite[key];
					this._prepareSprite(spriteInCell);
					sprite.childIdxByName[cell.name] = sprite.childs.length;
					sprite.childs.push(spriteInCell);
					spriteInCell.shortName = spriteInCell.name;
					spriteInCell.name = sprite.name + "-" + spriteInCell.name;
					this._addSprite(spriteInCell);
				}
			}
		}
		this.onAdd(sprite.name);
	}

	Sprites.prototype.addSkin = function(thing, relativePath) {
		var sprite = this._createSprite(thing);
		this._prepareSprite(sprite);
		this._dynamic[sprite.name] = sprite;
		sprite.filename = (relativePath || "") + (sprite.filename || sprite.name + ".png");
		sprite.src = sprite.src || this.dynamicURL + sprite.filename;
		sprite.index = this._dynlist.length;
		this._dynlist.push(sprite);
		this.onAdd(sprite.name);
		
		//if (sprite.shopGroup) {
		//	this.byShopGroup[sprite.shopGroup] = this.byShopGroup[sprite.shopGroup] || [];
		//	this.byShopGroup[sprite.shopGroup].push(sprite);
		//}
		return sprite;
	};

	Sprites.prototype.addSkinList = function(elements) {
		while (elements.length) {
			var elem = elements.shift();
			if (elem.group) {
				var lst = [];
				this.byGroup[elem.name] = lst;
				this.groupSkin = elem;
				for ( var i = 0; i < elem.skins.length; i++) {
					if (this._dynamic[elem.name])
						continue;
					var sprite = elem.skins[i];
					sprite.skin = sprite.skin || {};
					sprite.shopGroup = sprite.shopGroup || elem.shopGroup;
					if (elem.defaults) {
						for ( var key in elem.defaults) {
							sprite.skin[key] = sprite.skin[key] != null ?
								sprite.skin[key] : elem.defaults[key];
						}
					}
					lst.push(this.addSkin(sprite, elem.path));
				}
				this.groupSkin = null;
			} else {
				var sprite = this.addSkin(elem);
			}
		}
	}

	Sprites.prototype.loadAsync = function(callback) {
		var self = this;
		if (this.asyncLoaded == 1) {
			callback && this.asyncLoadCallbacks.push(callback);
			return
		} else if (this.asyncLoaded == 2){
			callback && callback()
			return
		}
		var a = this.asyncLoadCallbacks = []; 
		this.asyncLoaded = 1;
		callback && a.push(callback)
		$.ajax({
			url : withVersion(this, this.skinList),
			success : function(data) {
				self.assetsConfig = data[data.length-1];
				self.addSkinList(data);
				self.asyncLoaded = 2;
				self.onLoad();
				for (var i=0;i<a.length;i++)
					a[i]();
			}
		});
	};

	Sprites.prototype.getStyle = function(spriteName, frame) {
		var sprite = this.get(spriteName);
		if (!sprite)
			return {};
		var x = sprite.styleX, y = sprite.styleY;
		// frame>=1 and sprite has frames
		if (sprite.frames && frame) {
			x = sprite.frames[frame].x;
			y = sprite.frames[frame].y;
		}
		return {
			"width" : sprite.frameWidth,
			"height" : sprite.frameHeight,
			"background-image" : "url('" + sprite.texture.src + "')",
			"background-position" : "-" + x + "px -" + y + "px",
			"background-repeat" : "no-repeat"
		}
	}
	
	Sprites.prototype.getSkinStyleByName = function(spriteName) {
		var sprite = this._dynamic[spriteName]; // don't increase last access time
		return sprite ? this.getSkinStyleById(sprite.index) : {};
	}
	
	Sprites.prototype.getSkinStyleById = function(spriteId) {
		var sprite = this._dynlist[spriteId];
		var thInd = sprite.thInd;
		var chuunkNumber = Math.floor(thInd / this.assetsConfig.chunkSize) | 0;			
		var index = thInd % this.assetsConfig.chunkSize;
		var positionY = -index * this.shopThumbSize;
		return {
            'background-image': 'url(\''+ withVersion(this, this.dynamicURL +
					'all/all' + this.shopThumbSize + "-" + this.assetsConfig.thumbsVersion +
					'-' + chuunkNumber + '.nocache.png') + '\')',
            'background-position': '0px ' + positionY + 'px'
        }		
	}
	
	Sprites.prototype.loadSkinTypes = function(cb) {
		var self = this;
		if (this.skinBuilder) { // removed, seems unnecessary: || !window.SkinTypes)
			cb();
		}else {
			loadCtorData(this.constructorPath, function(data) {
				self.ctorData = data;
				self.skinBuilder = new SkinBuilderWorker(data, self.constructorPath);
				cb();
			});
		}
	}
	
	if (!exports.hasOwnProperty("sprites")) {
		exports.sprites = new Sprites();
		exports.Texture = Texture;
		exports.Sprite = Sprite;
		exports.Skin = Skin;
		exports.sprites.onProgress = function(progress, total, name) {
			console.log(progress + "/" + total + " resource='" + name + "'")
		}
	}
})(typeof exports === 'undefined' ? window : exports)

bombermine.directive({
	"spriteStyle": function() {
		return function(scope, element, attr) {
			scope.$watch(attr.spriteStyle, function(newValue, oldValue) {
				element.css(sprites.getStyle(newValue))
			})
		}
	},
	"spriteSkinStyleId": function() {
		return function(scope, element, attr) {
			scope.$watch(attr.spriteSkinStyleId, function(newValue, oldValue) {
				element.css(sprites.getSkinStyleById(newValue))
			})
		}
	},
	"spriteSkinStyleName": function() {
		return function(scope, element, attr) {
			scope.$watch(attr.spriteSkinStyleName, function(newValue, oldValue) {
				element.css(sprites.getSkinStyleByName(newValue))
			})
		}
	}
})
