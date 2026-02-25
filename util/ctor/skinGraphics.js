
//====================== helper functions ========================

function intColorToHtml(v) {
	function ts(b) {
		return (b < 16 ? "0" : "") + b.toString(16);
	}
	return "#" + ts(v & 0xff) + ts((v >> 8) & 0xff) + ts((v >> 16) & 0xff);
}

function floatRGBtoInt(r, g, b) {
	return ~~(r*255 + (g*255 << 8) + (b*255 << 16));
}

function channelNumber(ch) {
	switch(ch) {
	case 'r': return 0;
	case 'g': return 1;
	case 'b': return 2;
	default:  return 3;
	}
}

/**
 * static methods to work with tranferrable pixel arrays
 */
function PixelArrays() {}

PixelArrays.fromImage = function(img) {
	var w = img.width;
	var h = img.height;
	var canvas = createCanvas(w, h)
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, w, h);
	ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
	return {
		r: new Uint8Array(ctx.getImageData(0, 0, w, h).data),
		w: w,
		h: h
	};
}

PixelArrays.create = function(w, h) {
	return {
		r: new Uint8Array(w * h * 4),
		w: w,
		h: h
	};
}

/**
 * creates a canvas from transferrable pixel array
 */
PixelArrays.toCanvas = function(arr) {
	var canvas = createCanvas(arr.w, arr.h);
	var ctx = canvas.getContext('2d');
	var imageData = ctx.getImageData(0, 0, arr.w, arr.h);
	if (imageData.data.set) {
		imageData.data.set(arr.r);
	}else { // on nodejs
		var e = PixelArrays.bytes(arr);
		for(var p=0; p<e; p++)
			imageData.data[p] = arr.r[p];
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

/**
 * makes array non-tranferrable, but easier to process
 */
PixelArrays.upgrade = function(arr) {
	if (supportsSubarray) {
		arr.g = arr.r.subarray(1);
		arr.b = arr.r.subarray(2);
		arr.a = arr.r.subarray(3);
	}
	arr.stride = 4 * arr.w;
}

/**
 * makes array tranferrable again
 */
PixelArrays.downgrade = function(arr) {
	if (supportsSubarray) {
		delete arr.g;
		delete arr.b;
		delete arr.a;
	}
}

PixelArrays.copy = function(dst, dstX, dstY, src, srcX, srcY, w, h) {
	assert(dstX+w<=dst.w && dstY+h<=dst.h && srcX+w<=src.w && srcY+h<=src.h,
		"dstX+w<=dst.w && dstY+h<=dst.h && srcX+w<=src.w && srcY+h<=src.h");
	var dstBegin = dstY * dst.stride + dstX*4;
	var srcBegin = srcY * src.stride + srcX*4;
	for(var j=0; j<4*h; j++) {
		var dstP = dstBegin;
		var srcP = srcBegin;
		var dstEnd = dstBegin + 4*w;
		for (; dstP<dstEnd; dstP++, srcP++)
			dst.r[dstP] = src.r[srcP];
		dstBegin += dst.stride;
		srcBegin += src.stride;
	}
}

PixelArrays.area = function(arr) {
	return arr.w * arr.h;
}

PixelArrays.bytes = function(arr) {
	return 4 * arr.w * arr.h;
}

PixelArrays.transferList = function(arr) {
	return [arr.r.buffer];
}

/**
 * static methods to load nad manipulate tranferrable {pixelArray} sprites collection
 */
function Sprites() {}

/**
 * @callback {function(sprites)} Sprites.load~onDone
 */
Sprites.load = function(jsons, onDone) {
	
	function afterLoad() {
		if (finished)	
			return;
		var complete = true;
		for(var ikey in images) {
			if (!images[ikey].complete) {
				complete = false;
			}else if (images[ikey].width > 0 && undef(sprites[ikey])) {
				sprites[ikey] = PixelArrays.fromImage(images[ikey]);
			}
		}
		if (complete) {
			var size = 0;
			for(var ikey in images)
				size += images[ikey].width * images[ikey].height;
			console.log("Constructor sprites size: " + Math.round(size * 4 / 1000) + " kB");
			
			images = null; // free memory
			url2key = null;
			finished = true;
			onDone(sprites);
		}else {
			mySetTimeout(afterLoad, 30);
		}
	}
	
	function addImage(ikey, url) {
		if (url2key[url] == null) {
			images[ikey] = new Image();
			images[ikey].src = url;
			url2key[url] = ikey;
		}else // keep string with a key pointing to a real sprite
			sprites[ikey] = url2key[url];
	}
	
	var sprites = {}, images = {}, url2key = {};
	var finished = false;

	for(var tkey in jsons) {
		var type = jsons[tkey];
		for(var fkey in type.features) {
			feature = type.features[fkey];
			for(var skey in feature.sheets) {
				addImage(Sprites.key(tkey, fkey, skey),
					SkinTypes.getUrl(type, feature, feature.sheets[skey]));
			}
		}
		if (def(type.dummy)) {
			addImage(Sprites.specialKey(tkey, "dummy"),
				SkinTypes.getUrlImage(type, type.dummy));
		}	
	}
	afterLoad();
}

Sprites.get = function(sprites, key) {
	do { key = sprites[key]; } while (typeof(key) == "string");
	return key;
}

Sprites.key = function(tkey, fkey, skey) {
	return tkey + '-' + fkey + '-' + skey;
}

Sprites.specialKey = function(tkey, name) {
	return tkey + '-' + name;
}

Sprites.upgrade = function(sprites) {
	if (def(sprites.upgraded))	
		return;	
	for(var ikey in sprites) {
		if (typeof(sprites[ikey]) == "object")
			PixelArrays.upgrade(sprites[ikey]);
	}
	sprites.upgraded = true;
}

Sprites.transferList = function(sprites) {
	var result = [];
	for (var key in sprites) {
		if (typeof sprites[key] == "object")
			result.push(sprites[key].r.buffer);
	}
	return result;
}

function loadCtorData(dir, onDone) {
	loadCtorJsons(dir, function(json) {
		Sprites.load(json, function(sprites) {			
			onDone( {
				json: json,
				sprites: sprites
			} );
		} );
	} );
}

/**
 * @classdesc Base class for SkinBuilder and SkinThumbs
 * @constructor 
 * @augments SkinEdiableConfig
 * @param {SkinTypes} skinTypes Skin types (loaded from JSON).
 */
function SkinGraphics(json) {

	SkinConfig.call(this, json);
	 
	/**
	 * @protected
	 */
	this.calcItemRect = function(sheet, imageWidth, cell) {
		var w = sheet.size.x * sheet.cols;
		var h = sheet.size.y * sheet.rows;
		assert(imageWidth % w == 0, "imageWidth % ffs.x == 0");
		var sheetFullCols = ~~(imageWidth / w);
		var fullCol = cell % sheetFullCols;
		var fullRow = ~~(cell / sheetFullCols);
		return new Rect(fullCol * w, fullRow * h, w, h);
	}
	
	/**
	 * @protected
	 */
	this.calcExtraPos = function(sheet, imageWidth, cell) {
		var ffs = this.calcItemRect(sheet);
		var sheetFullCols = ~~(imageWidth / ffs.w);
		var fullRow = ~~((sheet.count-1) / sheetFullCols);
		
		var sheetCols = ~~(imageWidth / sheet.size.x);
		var col = cell % sheetCols;
		var row = ~~(cell / sheetCols);
		
		return new Point(col * sheet.size.x, row * sheet.size.y + (fullRow+1) * ffs.h);
	}	
	
	/**
	 * @protected
	 */
	this.addColors = function(colorSlots, tableInd, itemMargins) {
		this.recolorer.clearCurTable();
		for(var ckey in this.type.colors) {
			this.recolorer.addColor(
				this.type.colors[ckey].code, tableInd,
				colorSlots[ckey].finalValue, 
				this.type.colors[ckey].norm,
				itemMargins
			);
		}
	}	
	
	function clearReserveCanvas(canvas, w, h, forceClear) {
		var dirthy = true;
		if (def(w)) {
			if (canvas.width < w) {
				canvas.width = w;
				dirthy = false;				
			}
			if (canvas.height < h) {
				canvas.height = h;
				dirthy = false;
			}
		}
		if (undef(canvas.context))
			canvas.context = canvas.getContext('2d');
		if (dirthy && default_(forceClear, true))
			canvas.context.clearRect(0, 0, w, h);
	}
	
	/**
	 * @protected
	 */	
	this.setCanvas = function(canvas, img, x, y, w, h, oper) {
		clearReserveCanvas(canvas, w, h, !(oper == "source-atop"));
		canvas.context.globalCompositeOperation = oper || "copy";
		canvas.context.drawImage(img,
			x, y, w, h,
			0, 0, w, h);
	}
	
	/**
	 * @protected
	 */		
	this.createDst = function(w, h) {
		this.dstPA = PixelArrays.create(w, h);
		PixelArrays.upgrade(this.dstPA);
		this.dstZ	= new Uint8Array(PixelArrays.bytes(this.dstPA));
		
		this.recolorer	= new Recolorer(countKeys(this.type.features));
		this.dstReIndex	= new Plane.createNew(w, h, 16);
		this.dstReBr	= new Plane.createChannel_pixelArray(this.dstPA, this.type.brightnessSrc);
	}	
	
	/**
	 * @protected
	 */		
	this.prepareRender = function(sprite, item, rect) {
		// find a color z channel, if present
		var zSrc;
		for(var i=0; i<item.zSrc.length; i++) {
			zSrc = item.zSrc[i];
			if (zSrc=='r' || zSrc=='g' || zSrc=='b')
				break;
		}
		
		if (item.alphaBlend) {
			// recolor everyting rendered
			this.recolorer.recolorPixelArray(this.dstPA, this.dstReIndex, this.dstReBr);
			this.recolorer.clearTables();
			this.addColors(this.colorSlots, 0, item);
			// create a copy of the feature to be rendered
			this.srcPA = PixelArrays.create(rect.w, rect.h);
			PixelArrays.upgrade(this.srcPA);
			PixelArrays.copy(this.srcPA, 0, 0, sprite, rect.x, rect.y, rect.w, rect.h);
			rect.x = rect.y = 0;
			// recolor the feature copy
			this.srcIpZ		= new Plane.createChannelCopy_pixelArray(this.srcPA, zSrc);
			this.srcIpColors= new Plane.createChannel_pixelArray(this.srcPA, this.type.colorsSrc); 
			this.srcIpBr	= new Plane.createChannel_pixelArray(this.srcPA, this.type.brightnessSrc);	
			this.recolorer.recolorPixelArray(this.srcPA, this.srcIpColors, this.srcIpBr, null, this.srcIpZ);
			this.recolorer.clearTables();
		}else {
			this.addColors(this.colorSlots, this.recolAdd>>8, item);
			this.srcPA 		= sprite;
			this.srcIpZ		= new Plane.createChannel_pixelArray(this.srcPA, zSrc);
			this.srcIpColors= new Plane.createChannel_pixelArray(this.srcPA, this.type.colorsSrc); 
			this.srcIpBr	= new Plane.createChannel_pixelArray(this.srcPA, this.type.brightnessSrc);			
		}
	}
	
	/**
	 * @protected
	 */		
	this.render = function(dstX, dstY, 
		srcRect, sheet, item, sheetRow, isFirst, 
		row, flip)
	{
		var dstPA = this.dstPA;
		var dstReIndex = this.dstReIndex;
		var dstReBr = this.dstReBr;
		var dstZ = this.dstZ;
		var srcPA = this.srcPA;
		var srcIpColors = this.srcIpColors;
		var srcIpBr = this.srcIpBr;
		var srcIpZ = this.srcIpZ;
		var recolAdd = this.recolAdd;
		var dstArr = dstPA.r;
		var srcArr = srcPA.r;
		var dstBegin = 4 * (dstY * dstPA.w + dstX);
		var srcBegin = srcRect.y * srcPA.stride + 4 * srcRect.x;
		var srcStep = 4;
		var srcP;
		var z, zMin = item.zMin[row], zMax = item.zMax[row];
		
		if (flip) {
			srcBegin += 4 * (srcRect.w - 1);
			srcStep = -4;
		}
		
		var zFunc, zConst;
		switch(item.zSrc[row]) {
			case 'n':
				zFunc = function() { return dstZ[dstP]; };
				break;			
			case 'a':
				zFunc = supportsSubarray
					? function() { return srcIpZ.sub[srcP] == 255 ? item.zOpaque[row] : item.zTranslucent[row]; }
					: function() { return srcIpZ.data[srcP+srcIpZ.add] == 255 ? item.zOpaque[row] : item.zTranslucent[row]; };
				break;
			default: // r,g,b or const
				if (typeof(item.zSrc[row]) == "number") {
					zConst = item.zSrc[row];
					zFunc = function() { return zConst; };
				}else if (item.alphaBlend) {
					zConst = item.defaultZ[row] || 0;
					zFunc = supportsSubarray ? function() {
						return srcIpZ.sub[srcP] || zConst;
					} : function() {
						return srcIpZ.data[srcP+srcIpZ.add] || zConst;
					};
				}else {
					zFunc = supportsSubarray ? function() {
						return self.recolorer.reFlagCurTable[srcIpColors.sub[srcP]]
								? srcIpZ.sub[srcP]
								: item.defaultZ[row] || srcIpZ.sub[srcP];
					} : function() {
						return self.recolorer.reFlagCurTable[srcIpColors.data[srcP+srcIpColors.add]]
								? srcIpZ.data[srcP+srcIpZ.add]
								: item.defaultZ[row] || srcIpZ.data[srcP+srcIpZ.add];
					};
				}
		}
		
		var zTestFunc;
		var minZ, maxZ;
		if (def(item.ifZ)) {
			minZ = item.ifZ[sheetRow * 2];
			maxZ = item.ifZ[sheetRow * 2 + 1];
			zTestFunc = item.zSrc[row] == 'n' || isFirst
				? function() { return dstZ[dstP] >= minZ && dstZ[dstP] <= maxZ; }
				: function() { return dstZ[dstP] >= minZ && dstZ[dstP] <= Mat.max(maxZ, z); }
		}else {
			zTestFunc = item.zSrc[row] == 'n' || isFirst || !item.zTest[row]
				? function() { return true; }	
				: function() { return dstZ[dstP] <= z; }
		}
		
		var aFunc;
		switch(item.zSrc[row]) {
			case 'a':
				aFunc = function() { return 255; };
				break;
			default:
				aFunc = supportsSubarray
					? function() { return srcPA.a[srcP]; }
					: function() { return srcArr[srcP+3]; };
				break;				
		}		

		var setRgbFunc;		
		var writeR = sheet.lockChannels.indexOf("r") < 0;
		var writeG = sheet.lockChannels.indexOf("g") < 0;
		var writeB = sheet.lockChannels.indexOf("b") < 0;
		if (writeR && writeG && writeB) {
			setRgbFunc = supportsSubarray
				? function(r, g , b) {
					dstPA.r[dstP] = r;
					dstPA.g[dstP] = g;
					dstPA.b[dstP] = b;				
				}
				: function(r, g , b) {
					dstArr[dstP] = r;
					dstArr[dstP+1] = g;
					dstArr[dstP+2] = b;
				}
		}else {
			setRgbFunc = supportsSubarray
				? function(r, g , b) {
					if (writeR) dstPA.r[dstP] = r;
					if (writeG) dstPA.g[dstP] = g;
					if (writeB) dstPA.b[dstP] = b;				
				}
				: function(r, g , b) {
					if (writeR) dstArr[dstP] = r;
					if (writeG) dstArr[dstP+1] = g;
					if (writeB) dstArr[dstP+2] = b;
				};
		}
		
		var setAFunc;
		if (sheet.lockChannels.indexOf("a") < 0) {
			setAFunc = supportsSubarray
				? function(a) { dstPA.a[dstP] = a; }
				: function(a) {	dstArr[dstP+3] = a; };
		}else {
			setAFunc = function(a) {};
		}
		
		var	blendFuncCopy = supportsSubarray
			? function() {
				setRgbFunc(srcPA.r[srcP], srcPA.g[srcP], srcPA.b[srcP]);
				setAFunc(aFunc());
			}
			: function() {
				setRgbFunc(srcArr[srcP], srcArr[srcP+1], srcArr[srcP+2]);
				setAFunc(aFunc());
			};

		var blendFunc;
		if (item.alphaBlend) {
			blendFunc = supportsSubarray
				? function() {
					var dstA = dstPA.a[dstP];
					if (dstA == 0) {
						blendFuncCopy();
					}else {
						var srcA = aFunc();
						setRgbFunc(
							(srcPA.r[srcP]*srcA + dstPA.r[dstP]*(255-srcA))/255,
							(srcPA.g[srcP]*srcA + dstPA.g[dstP]*(255-srcA))/255,
							(srcPA.b[srcP]*srcA + dstPA.b[dstP]*(255-srcA))/255
						);
						setAFunc(Math.min(255, dstPA.a[dstP] + srcA));
					}
				}
				: function() {
					var dstA = dstArr[dstP+3];
					if (dstA == 0) {
						blendFuncCopy();
					}else {			
						var srcA = aFunc();
						setRgbFunc(
							(srcArr[srcP]  *srcA + dstArr[dstP]  *(255-srcA))/255,
							(srcArr[srcP+1]*srcA + dstArr[dstP+1]*(255-srcA))/255,
							(srcArr[srcP+2]*srcA + dstArr[dstP+2]*(255-srcA))/255
						);
						setAFunc(Math.min(255, dstArr[dstP+3] + srcA));
					}
				}
		}else {
			blendFunc = function() { 
				blendFuncCopy();
				setAFunc(aFunc());
			}
		}
		
		var testFunc;
		if (item.ifColor.length > 0) {			
			testFunc = item.codeMargin + item.codeMarginPlus > 0
				? function() { 
					if (dstArr[dstP+3] ==0)
						return false;
					for(var i=0; i<item.ifColor.length; i++) {
						var v = dstReIndex.data[dstP] & 0xff;
						if (v <= item.ifColor[i]+item.codeMarginPlus && v >= item.ifColor[i]-item.codeMargin)
							return true;
					}
					return false;
				}
				: function() {
					return dstArr[dstP+3] > 0 && item.ifColor.indexOf(dstReIndex.data[dstP] & 0xff) >= 0;
				};			
		}else
			testFunc = function() { return true; };
		
		for(var j=0; j<srcRect.h; j++) {
			var dstP = dstBegin;
			srcP = srcBegin;
			var dstEnd = dstP + 4*srcRect.w;	
			if (supportsSubarray) {
				for (; dstP<dstEnd; dstP+=4, srcP+=srcStep) {
					if (srcPA.a[srcP] && testFunc()) {
						z = zFunc();
						if (zTestFunc()) {
							dstReIndex.data[dstP] 	= srcIpColors.sub[srcP] + recolAdd;
							dstZ[dstP]		= z;
							blendFunc();
						}
					}
				}
			}else {
				for (; dstP<dstEnd; dstP+=4, srcP+=srcStep) {
					if (srcArr[srcP+3] && testFunc()) {
						z = zFunc();
						if (zTestFunc()) {
							dstReIndex.data[dstP] 	= srcIpColors.data[srcP+srcIpColors.add] + recolAdd;
							dstZ[dstP]		= z;
							blendFunc();
						}
					}
				}
			}
			if (item.hasEraser) {
				var ec = this.type.eraserCode + recolAdd;
				for (dstP=dstBegin; dstP<dstEnd; dstP+=4) {
					if (dstReIndex.data[dstP] == ec)
						dstZ[dstP]	= dstArr[dstP+3] = 0;
				}				
			}
			dstBegin += dstPA.stride;
			srcBegin += srcPA.stride;
		}
	}
	
	var self = this;
	this.recolAdd = this.dstPA = this.dstZ = this.dstReBr = this.dstReIndex =
	this.srcPA = this.srcIpZ = this.srcIpColors = this.srcIpBr = null;	
}

// SkinGraphics extends SkinRandom
SkinGraphics.prototype = Object.create(SkinConfig.prototype);
SkinGraphics.prototype.constructor = SkinGraphics;

/**
 * @constructor 
 * @param {int, Rect} arg
 */
function AugImageData(canvas, x, y, w, h) {
	if (undef(x)) {
		x = y = 0;
		w = canvas.width;
		h = canvas.height;
	}
	if (undef(canvas.context))
		canvas.context = canvas.getContext('2d');
	this.imageData = canvas.context.getImageData(x, y, w, h);
	this.data = this.imageData.data;
	this.stride = 4 * w;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	if (supportsSubarray) {
		this.r = this.data;
		this.g = this.data.subarray(1);
		this.b = this.data.subarray(2);
		this.a = this.data.subarray(3);
	}

	this.area = function() {
		return w * h;
	}
	this.putBack = function() {
		canvas.context.putImageData(this.imageData, x, y);
	}
}

/**
 * @classdesc One channel of an image or a matrix
 */
function Plane(w, h, data, add) {
	this.w	= w;
	this.h	= h;
	this.data	= data;
	this.add	= default_(add, 0);
	if (supportsSubarray)
		this.sub = this.data.subarray(this.add);	
}

/**
 * @constructor 
 */
Plane.createChannel = function(aid, channel) {
	return new Plane(aid.w, aid.h, aid.data, channelNumber(channel));
}

/**
 * @constructor 
 */
Plane.createChannel_pixelArray = function(pa, channel) {
	return new Plane(pa.w, pa.h, pa.r, channelNumber(channel));
}

/**
 * @constructor 
 */
Plane.createChannelCopy = function(aid, channel) {
	var add = channelNumber(channel);
	var data = new Uint8Array(aid.data.length);	
	for(var i=0; i<data.length; i+=4)
		data[i] = aid.data[i+add];
	return new Plane(aid.w, aid.h, data);
}

/**
 * @constructor 
 */
Plane.createChannelCopy_pixelArray = function(pa, channel) {
	var add = channelNumber(channel);
	var data = new Uint8Array(pa.r.length);	
	for(var i=0; i<data.length; i+=4)
		data[i] = pa.r[i+add];
	return new Plane(pa.w, pa.h, data);
}

/**
 * @constructor 
 */
Plane.createNew = function(w, h, bits) {
	var data = bits==16
		? new Uint16Array(4 * w * h)
		: new Uint8Array(4 * w * h);
	return new Plane(w, h, data);
}

function tranformHSV(aid, hueFilterMin, hueFilterMax, hueAdd) {
	hueFilterMin = default_(hueFilterMin, 0);
	hueFilterMax = default_(hueFilterMax, 360);
	hueAdd = default_(hueAdd, 0) + 720;
	
	assert(aid.x==0 && aid.y==0, "adi.x==0 && aid.y==0");
	var nBytes = aid.stride * aid.h;
	var arr = aid.data;
	for(var p=0; p<nBytes; p+=4) {
		if (arr[p+3] == 0)
			continue;
		var hsv = RGBtoHSV3(arr[p], arr[p+1], arr[p+2]);
		if (hsv.h < 0 ||
			hsv.h < hueFilterMin && hsv.h > hueFilterMax ||
			hueFilterMin < hueFilterMax && (hsv.h < hueFilterMin || hsv.h > hueFilterMax) )
		{
			continue;
		}
		hsv.h = (hsv.h + hueAdd) % 360;
		var rgb = HSVtoRGB3(hsv.h, hsv.s, hsv.v);
		arr[p]	= rgb.r;
		arr[p+1]	= rgb.g;
		arr[p+2]	= rgb.b;
	}
}

/**
 * @classdesc Replaces colors
 * @constructor 
 * @param {Number} featuresCount
 */
function Recolorer(tablesCount) {
	var self = this;

	/**
	 * @public
	 */		
	this.addColor = function(ind, tableInd, color, BRnorm, itemMargins) {
		var add = tableInd*256;
		for(var i=add+Math.max(0, ind-itemMargins.codeMargin);
			i<=add+Math.min(255, ind+itemMargins.codeMarginPlus); i++)
		{
			self.reFlagCurTable[i-add] = 1;
			reFlag[i] = 1;
			reR[i] = color & 0xff;
			reG[i] = (color >> 8) & 0xff;
			reB[i] = (color >> 16) & 0xff;
			reBrnorm[i] = def(BRnorm) ? Math.max(BRnorm, 1) : 0;
		}
		empty = false;
	}
	
	/**
	 * @public
	 */	
	this.clearTables = function() {
		reFlag = new Uint8Array(colorsCount);
		reR = new Uint8Array(colorsCount);
		reG = new Uint8Array(colorsCount);
		reB = new Uint8Array(colorsCount);
		reBrnorm = new Uint8Array(colorsCount);
		empty = true;
	}
	
	/**
	 * @public
	 */	
	this.clearCurTable = function() {
		if (self.reFlagCurTable.fill) {
			self.reFlagCurTable.fill(0);
		}else {
			for(var i=0; i<self.reFlagCurTable.length; i++)
				self.reFlagCurTable[i] = 0;
		}
	}		
	
	/**
	 * @public
	 */	
	this.recolorPixelArray = function(pa, ipIndex, ipBr, rect, ipZ) {
		if (empty)
			return;
		rect = rect || new Rect(pa);
		var arr = pa.r;
		for(var j=0; j<rect.h; j++) {
			var p = pa.stride*(rect.y+j) + rect.x*4;
			var dstEnd = p + 4*rect.w;
			for (; p<dstEnd; p+=4) {
				if (arr[p+3] == 0)
					continue;
				var v = ipIndex.data[p + ipIndex.add];
				if (reFlag[v]) {
					if (reBrnorm[v]) {
						var k = ipBr.data[p+ipBr.add] / reBrnorm[v];
						var isBlink = this.useBlink && ipBr.data[p+ipBr.add] == 255;
						//if (ipBrValue == 255)	k += 0.1;
						if (k <= 1) {
							arr[p]		= reR[v] * k;
							arr[p+1]	= reG[v] * k;
							arr[p+2]	= reB[v] * k;
						}else {
							var r = reR[v] * k;
							var g = reG[v] * k;
							var b = reB[v] * k;
							var s = (Math.max(r, 255) + Math.max(g, 255) + Math.max(b, 255) - 765) >> 1;
							if (isBlink)
								//s = Math.max(s + 16, 32);
								s += 24;
							arr[p]		= Math.min(255, r + s);
							arr[p+1]	= Math.min(255, g + s);
							arr[p+2]	= Math.min(255, b + s);
						}
						if (isBlink) {
							arr[p]		= Math.max(140, arr[p]);
							arr[p+1]	= Math.max(140, arr[p+1]);
							arr[p+2]	= Math.max(140, arr[p+2]);
						}
					}else {
						arr[p]		= reR[v];
						arr[p+1]	= reG[v];
						arr[p+2]	= reB[v];
					}
				}else if (ipZ) {
					ipZ.data[p + ipZ.add] = 0;
				}
			}
		}
	}
	
	colorsCount = default_(tablesCount, 1) * 256;
	
	var reFlag, reR, reG, reB, reBrnorm, empty;
	this.reFlagCurTable = new Uint8Array(256);
	this.clearTables();
}

var supportsSubarray, mySetTimeout;