function SkinBuilderSlave(ctorData) {
	SkinGraphics.call(this, ctorData.json);
	this.sprites = ctorData.sprites;
	
	/**
	 * Builds a skin synchronously with current options.
	 *		Call deserialize() or setRandom() before this to set options
	 * @public
	 * @param publicFrameSize minimum frame size.
	 * 		If specified, only public frame is generated.
	 * @returns {skin, pixelArray}
	 */
	this.build = function(req) {
		return req.name ? this.buildSkin(req) : this.buildItem(req);
	}
	
	this.buildSkin = function(req) {
		try {
			this.deserialize(req.name);
		} catch(e) {
			return { skin: { name: req.name } };
		}
		var type = this.type;
		
		this.enumThings();		

		if (def(req.onlyPublicFrame))
			req.onlyPublicFrameSize = 0;
		if (def(req.onlyPublicFrameSize)) {
			this.calcSize(req.onlyPublicFrameSize, req.onlyPublicFrameSize);
			this.skinW = this.width;
			this.skinH = this.height;
			var pf = getPublicFrame(type.skin);
			this.selectedRow = pf[0];
			this.selectedCol = pf[1];
		}else {
			this.calcSize();
			this.selectedRow = null;
			this.selectedCol = null;
		}

		this.createDst(this.skinW, this.skinH);
		
		this.deriveColors();
		
		this.recolorer.useBlink = type.blink;
		
		var isFirst = true;
		this.recolAdd = 0;
		for(var fkey in this.things) {
			var errorCode = drawLayer(fkey, isFirst);
			if (errorCode) {
				return { skin: { name: req.name } };
			}
			isFirst = false;
			this.recolAdd += 256;
		}
		
		this.recolorer.recolorPixelArray(this.dstPA, this.dstReIndex, this.dstReBr);
		
		var skin;
		if (self.width==self.type.skin.frameWidth && self.height==self.type.skin.frameHeight) {
			skin = self.type.skin;			
		}else {
			skin = clone(self.type.skin);
			skin.renderWidth = Math.floor(skin.renderWidth / skin.frameWidth * self.width);
			skin.frameWidth  = self.width;
			skin.frameHeight = self.height;			
		}

		PixelArrays.downgrade(this.dstPA);
		
		return {
			skin: {
				name: req.name,
				skin: skin,
			},
			pixelArray: this.dstPA
		};
	}

	/**
	 * @private
	 */	
	function drawLayer(fkey, isFirst) {
		var itemSlot = self.itemSlots[fkey];
		var skey = self.getSheetKey(fkey);
		var sheet = self.getSheet(fkey);
		var thing = self.things[fkey];
		var item = self.getCurItem(fkey);
		var flip = itemSlot.flip && self.isItemFlippable(fkey);
		
		var sprite = Sprites.get(ctorData.sprites, Sprites.key(self.typeKey, fkey, skey));
		if (!def(sprite)) {
			// why don't throw an exception? to see where other exception are occuring
			return 1;
		}
		var itemRect = self.calcItemRect(sheet, sprite.w, item.cell);
		
		self.prepareRender(sprite, item, itemRect);

		for(var i=0; i<sheet.row.length; i++) { // i in [0..self.type.rows-1], but may be shorter
			if (sheet.row[i] === '' || 
				(self.selectedRow != null && i != self.selectedRow))
				continue;

			// mirror
            var row = i;
			var sheetRow = sheet.row[i];
			var flipRow = flip;
			var tailParallax = [0, 0];
			if (self.type.rowDirection[i] == "r" || self.type.rowDirection[i] == "l") {
                var symmRow = self.type.symmRow[i];
				var symmSheetRow = sheet.row[symmRow];
				flipRow = item.mirrorLeft
					? self.type.rowDirection[i] == "l"
					: symmSheetRow!="m" && (sheetRow=="m" || flip);
				if (flipRow) {
                    row = symmRow;
					sheetRow = symmSheetRow;                    
				}
			}else if (sheetRow == "m") {
				sheetRow = sheet.row[self.type.symmRow[i]]
				flipRow = !flip;
				tailParallax = item.tailParallax;
			}
			
			// draw cells
			for(var j=0; j<self.type.cols; j++) {
				if (self.selectedCol != null && j != self.selectedCol)
					continue;
				var fdx = thing.dx[i][j] + self.dx[i] + sheet.crop.x;
				var fdy = thing.dy[i][j] + self.dy[i] + sheet.crop.y;
				var srcRect = new Rect(
						sheet.col[i][j]*sheet.size.x + sheet.crop.x + itemRect.x,
						sheetRow*sheet.size.y + sheet.crop.y + itemRect.y,
						sheet.crop.w, sheet.crop.h
					);
				var parallaxMul = flip ? -1 : 1;
				var dstRect = new Rect(
						fdx + parallaxMul * tailParallax[0], 
						fdy + parallaxMul * tailParallax[1],
						sheet.crop.w, sheet.crop.h
					);
				if (flipRow) {
					Rect.fit([dstRect], self.width, self.height, [srcRect]);
				}else
					Rect.fit([dstRect, srcRect], self.width, self.height);
				var dstShiftMul = self.selectedRow==null ? 1 : 0;
				self.render(
					self.width*j*dstShiftMul + dstRect.x, self.height*i*dstShiftMul + dstRect.y,
					srcRect, sheet, item, sheetRow, isFirst,
					row, flipRow);
			}
		}
		return 0;
	}
	
	this.buildItem = function(id) {
		this.setType(id.type);
		var skey = this.skinTypes.getSheetKey(id);
		var sheet = this.skinTypes.getSheet(id);
		var item = this.skinTypes.getItem(id);
		var feature = this.skinTypes.getFeature(id)
		var publicFrame, hasDummy;
		var itemCrop, srcRect, dstRect;
		
		var sprite = Sprites.get(this.sprites, Sprites.key(id.type, id.key, skey));
		if (!def(sprite))
			return {};
		var featureRect = this.calcItemRect(sheet, sprite.w, item.cell);		
		
		var thumb = item.thumb;		
		if (thumb) {
			publicFrame = thumb.publicFrame;
			hasDummy = def(thumb.dummyCrop);
			itemCrop = thumb.crop;
		}else {
			publicFrame = item.publicFrame;
			hasDummy = false;
			itemCrop = item.thumbCrop;
		}
		
		srcRect = new Rect(
			featureRect.x + publicFrame[1]*sheet.size.x + itemCrop.x,
			featureRect.y + publicFrame[0]*sheet.size.y + itemCrop.y,
			itemCrop.w,
			itemCrop.h
		);
		
		if (hasDummy) {
			var dummySprite = Sprites.get(this.sprites, Sprites.specialKey(id.type, "dummy"));
			if (!def(dummySprite))
				return {};
			
			var w = thumb.dummyCrop.w;
			var h = thumb.dummyCrop.h;
			
			dstRect = new Rect(
				itemCrop.x + thumb.shift[0],
				itemCrop.y + thumb.shift[1],
				srcRect.w, srcRect.h
			);
			Rect.fit([dstRect, srcRect], w, h);
			this.createDst(w, h);				
		}else {
			dstRect = new Rect(0, 0, srcRect.w, srcRect.h);
			this.createDst(dstRect.w, dstRect.h);	
		}
		
		this.setDefaultColors();
		for(var ckey in this.colorSlots) {
			if(this.isColorSlotEnabled(ckey) && this.isColorOptional(ckey))
				this.setColorEnabled(ckey, true);
		}
		this.recolorer.useBlink = this.type.blink;
		this.recolorer.clearTables();
		
		if (hasDummy) {
			this.recolAdd = 0;
			this.overrideColors(thumb.colors);
			this.deriveColors();
			if (thumb.recolor)
				this.addColors(this.colorSlots, 0, item);
			
			var dummyItem = {
				alphaBlend: 0,
				codeMargin: 0,
				ifColor: [],
				zMin: [0],
				zMax: [255],
				defaultZ: [0]
			};
			var dummySheet = {
				lockChannels: ""
			};
			for(var key in thumb)
				dummyItem[key] = thumb[key];
			this.prepareRender(dummySprite, dummyItem, thumb.dummyCrop);
			this.render(
				0, 0,
				thumb.dummyCrop, dummySheet, dummyItem, 0, true,
				0, false);
		}
		
		this.recolAdd = 256;
		this.overrideColors(item.colors);
		this.deriveColors();
		this.addColors(this.colorSlots, 1, item);
		
		this.prepareRender(sprite, item, srcRect);
		
		var sheetRow = publicFrame[0];
		var row = 0;
		while(row+1 < sheet.row.length && sheet.row[row] != sheetRow)
			row++;
		this.render(
			dstRect.x, dstRect.y,
			srcRect, sheet, item, sheetRow, !hasDummy,
			row, false);
		
		this.recolorer.recolorPixelArray(this.dstPA, this.dstReIndex, this.dstReBr);
		
		return {
			id: id,
			pixelArray: this.dstPA
		};
	}
	
	// initialization
	var self = this;
	Sprites.upgrade(ctorData.sprites);
}

// SkinBuilder extends SkinRandom
SkinBuilderSlave.prototype = Object.create(SkinGraphics.prototype);
SkinBuilderSlave.prototype.constructor = SkinBuilderSlave;

function prepareResult(result) {
	if (def(result.pixelArray)) {
		result.canvas = PixelArrays.toCanvas(result.pixelArray);
		delete result.pixelArray;
	}	
}

/**
 * @calss
 * builds skins without web worker and synchronously (but returns result trhoug callback)
 */
function SkinBuilderSync(ctorData) {

	/**
	 * @public
	 * @param {object} request
	 * 		{ name: skin code
	 * 		  onlyPublicFrameSize: minimum frame size. If specified, only public frame is generated.
	 * 		}
	 */
	this.buildSync = function(req) {
		var result = skinBuilderSlave.build(req);
		prepareResult(result);
		return result;
	}
	
	/**
	 * @public
	 */
	this.build = function(req, cb) {
		cb(this.buildSync(req));
	}
	
	var skinBuilderSlave = new SkinBuilderSlave(ctorData);
}

/**
 * @calss
 * builds skins with web worker
 * 
 */
function SkinBuilderWorker(ctorData, workerScriptDir) {

	/**
	 * @public
	 * @param {object} request
	 * 		{ name: skin code
	 * 		  onlyPublicFrameSize: minimum frame size. If specified, only public frame is generated.
	 * 		}
	 * @callback {function({skin, canvas})}
	 */
	this.build = function(req, cb) {
		queue.push(req);
		cbQueue.push(cb);
		if (ready)
			buildFromQueue();
	}
	
	function buildFromQueue() {
		ready = false;
		var req = queue[0];
		queue.splice(0, 1);
		worker.postMessage(req);
	}	
	
	function onMessage(e) {
		if (queue.length > 0) {
			buildFromQueue();
		}else
			ready = true;
		if (e.data != "done") {
			prepareResult(e.data);
			cbQueue[0](e.data);
			cbQueue.splice(0, 1);
		}
	}
	
	// initialization
	var self = this;
	var ready = false;
	var worker = new Worker((workerScriptDir || "") + 'skinBuilderWorker.js');
	var queue = [];
	var cbQueue = [];
	
	assert(!ctorData.sprites.upgraded, "SkinBuilderWorker: !sprites.upgraded");
	
	worker.addEventListener('message', onMessage, false);
	worker.postMessage(ctorData, Sprites.transferList(ctorData.sprites) );
}