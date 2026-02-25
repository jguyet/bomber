/**
 * Names of skin configs (without .json extension)
 */
var skinConfigFiles = ["s_hamster_v3/hamster", "s_pony_v3/mare", "s_bomber/bomber_v3", "s_dino/dino"];

// hardcoded temporarily, until camouflage color values are used from tileset config
//var camoColors = ["5F7C1F", "877E58", "AA7621"];
var camoColors = [];

var base64decode, base64encode;

/**
 * Codes of skin transaction result
 */
CtorBuyResult = function() {};
CtorBuyResult.SUCCES = 0;
CtorBuyResult.NOGOLD = 1;
CtorBuyResult.NOPLUT = 2;
CtorBuyResult.ERROR = 3;

var DUMMY_COLOR = 0x1000000;

//===================================================================================
//================================= helper functions ================================
//===================================================================================

function setDefaults(obj, defaults, excludeKeys) {
	if (!defaults)
		return;
	excludeKeys = excludeKeys || [];
	for(var dkey in defaults) {
		if (undef(obj[dkey]) && excludeKeys.indexOf(dkey)<0) {
			obj[dkey] = defaults[dkey];
		}
	}
}

function def(v) {
	return typeof v != "undefined" && v !== null;
}

function undef(v) {
	return typeof v == "undefined" || v === null;
}

function default_(obj, value) {
	return def(obj) ? obj : value;
}

function assert(cond, ex) {
	if (!cond) throw "Skinbuilder assertion failed: " + ex;
}

function randomInt(maxPlus1) {
	return Math.floor(maxPlus1 * Math.random());
}

function countKeys(obj) {
	var c = 0;
	for(var key in obj)
		c++;
	return c;
}

function keyByIndex(obj, ind) {
	for(var key in obj) {
		if (ind == 0)
			return key;
		ind--;
	}
	return null;
}

function propByIndex(obj, ind) {
	for(var key in obj) {
		if (ind == 0)
			return obj[key];
		ind--;
	}
	return null;	
}

function indexOfKey(obj, key) {
	var ind = 0;
	for(var k in obj) {
		if (k == key)
			return ind;
		ind++;
	}
	return -1;
}

function clone(obj) {
	return typeof jQuery != "undefined"
		? jQuery.extend(true, {}, obj)
		: JSON.parse(JSON.stringify(obj));
}

function isArray(obj) {
    return obj && typeof obj == "object" && obj.__proto__.push;
}

function forceArray(arr, length) {
	if (!isArray(arr))
		arr = [arr];
	if (length) {
		assert(arr.length == 1 || arr.length == length);
		while(arr.length < length)
			arr.push(arr[0]);
	}
	return arr;
}

function forceRows(arr, func) {
	if (!isArray(arr))
		arr = [arr];
	if (arr.length < 2)
		arr.push(arr[0]);
	while(arr.length < 4)
		arr.push(func ? func(arr[arr.length-2]) : arr[arr.length-2]);
	return arr;
}

function forceRowsCols(a, cols, func) {
	if (!isArray(a))
		a = [a];
	for(var i=0; i<2; i++)
		a[i] = typeof a[i] != "undefined" ? forceArray(a[i], cols) : a[0];
	for(var i=2; i<4; i++) {
		a[i] = typeof a[i] != "undefined" ? forceArray(a[i]) : [];
		if (a[i].length) {
			a[i] = forceArray(a[i], cols);
		}else {
			for(var j=0; j<cols; j++)
				a[i][j] = func ? func(a[i-2][j]) : a[i-2][j];
		}
	}		
	return a;
}

function matchProp(obj, tmpl) {
	for (var key in tmpl) {
		if (typeof obj[key] != typeof tmpl[key])
			return false;
		switch(typeof tmpl[key]) {
		case "object":
			if (!matchProp(obj[key], tmpl[key]))
				return false;
			break;
		case "function":
			break;
		default:
			if (obj[key] != tmpl[key])
				return false;
			break;
		}
	}
	return true;
}

function filterByProp(arr, tmpl) {
	var res = [];
	for(var i=0; i<arr.length; i++) {
		if (matchProp(arr[i], tmpl))
			res.push(arr[i]);
	}
	return res;
}

function indexByProp(arr, tmpl) {
	for(var i=0; i<arr.length; i++) {
		if (matchProp(arr[i], tmpl))
			return i;
	}
	return -1;
}

function spliceByProp(arr, tmpl) {
	var i = 0;
	while(i < arr.length) {
		if (matchProp(arr[i], tmpl))
			arr.splice(i, 1);
		else
			i++;
	}
}

function elementByProp(arr, tmpl) {	
	var ind = indexByProp(arr, tmpl);
	return ind<0 ? null : arr[ind];
}

function randomElement(arr) {
	return arr.length==0 ? null : arr[randomInt(arr.length)];
}

function arrayOfElemtntsProp(arr, propName) {
	var props = [];
	for(var i=0; i<arr.length; i++)
		props.push(arr[i][propName]);
	return props;
}

function hexColorToInt(str) {
	if (typeof str != "string")
		return str;
	var num = parseInt(str, 16);
	return (num >> 16) + (num & 0xff00) + ((num & 0xff) << 16);
}

/**
 * @classdesc Serializes skins
 * @throws Invalid src64 if decoding (wrong characters or length)
 */
Serializer = function(src64) {
	var dst, accum, mult;
	var src, accumBits, srcInd;
	var crc = 0, crcBits = 6;
	
	if (def(src64)) {
		try {
			src64 = src64.replace(/_/g, "/");
			src64 = src64.replace(/\$/g, "+");
			src = base64decode(src64);			
		}catch(ex) {
			throw "Serializer: invalid character";
		}
		accumBits = 0;
		srcInd = 0;
	}else {
		dst = "";
		accum = 0;
		mult = 1;
	}

	function updateCrc(bit) {
		crc = (crc*3 + bit) % (1 << crcBits);
	}
	
	function writeBit(bit) {
		updateCrc(bit);
		accum += bit * mult;
		mult *= 2;
		if (mult == 256) {
			dst += String.fromCharCode(accum);
			accum = 0;
			mult = 1;
		}
	}
	
	/**
	 * @throws Source is too short
	 */	
	function readBit() {		
		if (accumBits == 0) {
			if (srcInd == src.length) {
				throw "Serializer: source is too short";
			}
			accum = src.charCodeAt(srcInd++);
			accumBits = 8;
		}
		var result = accum & 1;
		accum >>= 1;
		accumBits--;
		updateCrc(result);
		return result;
	}
	
	/**
	 * @public
	 */	
	this.write = function(value, bits) {
		assert(value <= (1<<bits)-1, "value <= (1<<bits)-1");
		for(var i=0; i<bits; i++) {
			writeBit(value & 1);
			value >>= 1;
		}
	}
	
	/**
	 * @public
	 * @returns {Number}
	 * @throws Source is too short
	 */
	this.read = function(bits) {
		var value=0, mult=1;
		for(var i=0; i<bits; i++) {
			value += readBit() * mult;
			mult *= 2;
		}
		return value;
	}
	
	/**
	 * @public
	 * @returns Base 64 encoded data
	 */	
	this.result64 = function() {
		if (mult > 1) {
			dst += String.fromCharCode(accum);
			mult = 1;
		}
		var result = base64encode(dst);
		result = result.replace(/\//g, "_");
		result = result.replace(/\+/g, "$");
		return result;
	}

	/**
	 * @public
	 */	
	this.writeCrc = function() {
		this.write(crc, crcBits);
	}

	/**
	 * @public
	 */	
	this.readValidateCrc = function() {
		var v = crc;
		if (this.read(crcBits) != v)
			throw "Serializer: wrong crc";
	}	
}

/**
 * @public
 */		
Serializer.prototype.writeColor = function(color, bits) {
	var r = (color & 0xff) >> (8-bits);
	var g = ((color>>8) & 0xff) >> (8-bits);
	var b = ((color>>16) & 0xff) >> (8-bits);
	this.write(r, bits);
	this.write(g, bits);
	this.write(b, bits);
}

/**
 * @public
 * @returns {Number} color
 * @throws Source is too short
 */	
Serializer.prototype.readColor = function(bits) {
	var lb = 8 - bits;
	//var add = ((1 << lb) - 1) >> 1;
	var add = (1 << lb) >> 1;
	var r = (this.read(bits) << lb) + add;
	var g = (this.read(bits) << lb) + add;
	var b = (this.read(bits) << lb) + add;
	return r + (g << 8) + (b << 16);
}

/**
 * @public
 * @returns {Number} color
 * @throws Source is too short
 */	
Serializer.killColorBits = function(value, bits) {
	var lb = 8 - bits;
	var add = (1 << lb) >> 1;
	var r = (value & 0xff) >> lb;
	var g = ((value >> 8) & 0xff) >> lb;
	var b = (value >> 16) >> lb;	
	r = (r << lb) + add;
	g = (g << lb) + add;
	b = (b << lb) + add;
	return r + (g << 8) + (b << 16);
}


/**
 * @public
 */		
Serializer.prototype.writeBool = function(bool) {
	this.write(bool ? 1 : 0, 1);
}

/**
 * @public
 * @returns {Boolean}
 */		
Serializer.prototype.readBool = function() {
	return this.read(1) == 1;
}

/**
 * @classdesc Identifies one item for a given skin type
 * @constructor 
 */
function ItemId(typeKey, featureKey, index) {
	this.type = typeKey;
	this.key = featureKey;
	if (def(index))
		this.index = index;
};

ItemId.equals = function(a, b) {
	return a.type==b.type && a.key==b.key && a.index==b.index;
};

/**
 * @classdesc Identifies one item for a given skin type
 * @constructor 
 */
function ColorId(typeKey, colorKey, value) {
	this.type = typeKey;
	this.key = colorKey;
	if (def(value))
		this.value = value;
};

/** 
 * static methods to work with cost
 */
function Costs() {}

Costs.zero = function() {
	return Costs.create(0, 0);
}

Costs.big = function() {
	return Costs.create(0x7FFFFFFF, 0x7FFFFFFF);
}

Costs.copy = function(cost) {
	return Costs.create(cost.gold, cost.plut);
}

Costs.create = function(gold_cost, plut) {
	if (def(gold_cost) && def(gold_cost.gold)) {
		return {
			gold: gold_cost.gold,
			plut: gold_cost.plut
		}
	}else {
		return {
			gold: default_(gold_cost, 0),
			plut: default_(plut, 0)
		}
	}
}

Costs.add = function(sum, summand) {
	sum.gold += summand.gold;
	sum.plut += summand.plut;
}

Costs.applyDiscount = function(cost, discount) {
	cost.gold = Math.max(cost.gold - discount.gold, 0);
	cost.plut = Math.max(cost.plut - discount.plut, 0);
}

Costs.equals = function(a, b) {
	return a.gold == b.gold && a.plut == b.plut;
}

Costs.orderLess = function(a, b) {
	return a.plut < b.plut || (a.plut == b.plut && a.gold < b.gold);
}

Costs.canAfford = function(fortune, expense) {
	return fortune.plut >= expense.plut && fortune.gold >= expense.gold;
}

Costs.isZero = function(cost) {
	return cost.gold + cost.plut == 0;
}

Costs.isFree = function(obj) {
	return obj.cost.gold + obj.cost.plut == 0;
}

Costs.of = function(obj, key) {	
	key = key || "cost";
	if (typeof(obj[key]) == "number")
		return Costs.create(0, obj[key]);
	var old = obj[key] || {};
	return Costs.create(old.gold, old.plut);
}

Costs.attach = function(obj, key) {
	key = key || "cost";
	obj[key] = Costs.of(obj, key);
}

/**
 * @classdesc Represents point or size
 * @constructor 
 * @param {int, int[1], int[2], AugImageData, Rect}
 */
function Point(arg, y) {
	if (typeof arg.w != "undefined") {	// AugImageData, Rect
		this.x = arg.w;
		this.y = arg.h;
	}else if (typeof arg[0] != "undefined") {	// int[2], int[1]
		this.x = arg[0];
		this.y = default_(arg[1], this.x);
	}else {				// coord
		this.x = arg;
		this.y = default_(y, this.x);
	}	
}

/**
 * @constructor 
 * @param {int, int[4], Point, AugImageData}
 */
function Rect(arg, y, w, h) {
	if (typeof arg.w != "undefined") {	// AugImageData
		this.x = default_(arg.x, 0);
		this.y = default_(arg.y, 0);
		this.w = arg.w;
		this.h = arg.h;
	}else if (typeof arg.x != "undefined") {	// Point (size)
		this.x = this.y = 0;
		this.w = arg.x;
		this.h = arg.y;
	}else if (typeof arg[0] != "undefined") {	// int[4]
		this.x = arg[0];
		this.y = arg[1];
		this.w = arg[2];
		this.h = arg[3];
	}else {				// coords
		this.x = arg;
		this.y = y;
		this.w = w;
		this.h = h;
	}
}

Rect.prototype.addLeft = function(d) {
	this.x += d;
	this.w -= d;
}

Rect.prototype.addTop = function(d) {
	this.y += d;
	this.h -= d;
}

// TODO move function?
/**
 * Fits rects[0] to [0,0,w-1,h-1] and changes other rect accordingly
 */ 
Rect.fit = function(rects, w, h, flippedRects) {
	flippedRects = flippedRects || [];
	var allRects = rects.concat(flippedRects);	
	var d = -rects[0].x;
	if (d > 0) {
		for(var i=0; i<rects.length; i++)
			rects[i].addLeft(d);
		for(var i=0; i<flippedRects.length; i++)
			flippedRects[i].w -= d;
	}
	d = -rects[0].y;
	if (d > 0) {
		for(var i=0; i<allRects.length; i++) 
			allRects[i].addTop(d);
	}
	d = rects[0].x + rects[0].w - w;
	if (d > 0) {
		for(var i=0; i<rects.length; i++)
			rects[i].w -= d;
		for(var i=0; i<flippedRects.length; i++) 
			flippedRects[i].addLeft(d);
	}
	d = rects[0].y + rects[0].h - h;
	if (d > 0) {
		for(var i=0; i<allRects.length; i++)
			allRects[i].h -= d;
	}
}

function killColorBits(type, ckey, value) {
	var ser = type.serialization[type.serialization.length - 1];
	var ind = indexByProp(ser.colors, {"key": ckey} );
	if (ind < 0)
		return value;
	return Serializer.killColorBits(value, ser.colors[ind].bits);
}

/**
 * loads and prepares ctor configs
 * @callback {function(json)} onDone
 */
function loadCtorJsons(dir, onDone) {
	
	/**
	* loads and megrges jsons
	* @callback {function(json)} onDone
	*/
	function loadMultipleJsons(dir, files, onDone) {
		var filesLeft = files.length;
		var result = {};
		for(var i=0; i<files.length; i++) {
			var name = dir + files[i] + ".json";
			loadJson(name,
				function(data) {
					for(var key in data)
						result[key] = data[key];
					if (--filesLeft == 0)
						onDone(result);
				},
				function() {
					if (--filesLeft == 0)
						onDone(result);
				}
			);
		}
	}
	
	function JA(cond, ex) {
		if (!cond) {
			console.log("Error in skinbuilder JSON: " + ex);
			error = true;
			return true;
		}
		return false;
	}
	
	function JAhas(obj, keys, keysNo) {
		keys   = forceArray(keys);
		keysNo = forceArray(keysNo || []);
		for(var i=0; i<keys.length; i++)
			JA(def(obj[keys[i]]), obj.constructor.name + " has no " + keys[i]);
		for(var i=0; i<keysNo.length; i++)
			JA(undef(obj[keysNo[i]]), obj.constructor.name + " has " + keysNo[i]);
	}
	
	function prepareItem(type, item, sheet, feature) {
		function prepareZ(obj) {
			var defs = {
				zSrc: ['n'],
				zMin: [0],  // zMin & zMax are used only with sSrc=r,g,b
				zMax: [255],
				zTranslucent: [0],
				defaultZ: null,
				zTest: [true]
			};
			setDefaults(obj, defs);
			//setDefaults(obj, {
			//	//zOpaque: 255,
			//	zTranslucent: 0
			//});
			for(var key in defs)
				obj[key] = forceRows(obj[key]);
			if (def(obj.zOpaque))
				obj.zOpaque = forceRows(obj.zOpaque);
			for(var i=0; i<type.rows; i++) {
				switch(obj.zSrc[i]) {
				case 'n':	// none
					break;
				case 'a':	// alpha
					JAhas(obj, ["zOpaque", "zTranslucent"]);
					break;
				case 'r':
				case 'g':
				case 'b':	
					break;
				}
			}
			if (def(obj.defaultZ)) {
				obj.defaultZ = forceRows(item.defaultZ);
			}else {
				obj.defaultZ = [];
				//for(var i=0; i<type.rows; i++) {
				//	if (typeof obj.zSrc[i] == "number")
				//		obj.defaultZ[i] = obj.zSrc[i];
				//}
			}
		}
		
		JA(def(sheet), "def(sheet) " + item._name);

		setDefaults(item, sheet.defaultItem);

		if (error) return;
		
		setDefaults(item, {
			cell: sheet.count == 1 ? 0 : null,
			tailParallax: [0, 0],
			flippable: false,
			mirrorLeft: false,
			alphaBlend: false,
			hasEraser: false,
			widen: 0,
			heighten: 0,
			shiftSkinX: 0,
			shiftSkinY: 0,
			colors: {},
			colorSlots: [],
			ifColor: [],
			publicFrame: [0, 0],
			ifZ: null,
			defaultZ: null,
			tag: "",
			dontRenderTags: [],
			shiftTags: {}
		});
		JAhas(item, ["sheet", "cell", "cost"]);
		JA(item.cell < sheet.count, "item.cell < sheet.count " + item._name);
		
		// TODO: deprected
		if (def(item.shiftRight))
			item.shiftSkinX = item.shiftRight;
		prepareZ(item);
		setDefaults(item, {
			codeMargin: 	item.zSrc.indexOf("a") >= 0 ? 1 : 0, // item.alphaBlend ||
			codeMarginPlus: item.zSrc.indexOf("a") >= 0 ? 1 : 0
		});

		item.thumbCrop = new Rect(item.thumbCrop);
		
		var thumb = item.thumb;
		if (def(thumb) || def(feature.defaultThumb)) {
			thumb = thumb || {};
			//setDefaults(thumb, { thumbCrop: [16, 8, 30, 42], item.thumbCrop} );
			setDefaults(thumb, sheet.defaultItem.thumb);
			setDefaults(thumb, feature.defaultThumb);
			setDefaults(thumb, {
				publicFrame: [0, 0],
				shift: [0, 0],
				scale: 2,
				crop: sheet.crop,
				dummyzSrc: 'n',
				colors: {},
				recolor: false
			});
			thumb.crop = new Rect(thumb.crop);
			if (thumb.dummyCrop) {
				thumb.dummyCrop = new Rect(thumb.dummyCrop);
			}
			thumb.tailParallax = forceArray(item.tailParallax, 2);
			
			prepareZ(thumb);
			for(var ckey in thumb.colors) {
				JAhas(type.colors, [ckey]);
				thumb.colors[ckey] = hexColorToInt(thumb.colors[ckey]);
			}
			
			item.thumb = thumb; // deprecated
		}

		item.tailParallax = forceArray(item.tailParallax, 2);
		item.dontRenderSlots = forceArray(item.dontRenderSlots);
		
		item.ifColor = forceArray(item.ifColor);
		for(var i=0; i<item.ifColor.length; i++) {
			if (typeof(item.ifColor[i]) == "string") {
				JAhas(type.colors, item.ifColor[i]);
				item.ifColor[i] = type.colors[item.ifColor[i]].code;
			}
		}
		
		if (def(item.ifZ))
			item.ifZ = forceArray(item.ifZ, 2 * type.rows);
		
		for(var ckey in item.colors) {
			JAhas(type.colors, [ckey]);
			if (typeof item.colors[ckey] == "string") {
				item.colors[ckey] = killColorBits(type, ckey, hexColorToInt(item.colors[ckey]));
			}else {
				setDefaults(item.colors[ckey], {
					mul: 1,
					add: 0
				});
			}
		}
		
		for(var key in item.shiftTags) {
			var cs = item.shiftTags[key];
			setDefaults(cs, {dx: [[0]], dy:[[0]]});
			cs.dx = forceRowsCols(cs.dx, type.cols);
			cs.dy = forceRowsCols(cs.dy, type.cols);
		}

		for(var i=0; i<item.colorSlots.length; i++)
			JAhas(type.colors, [item.colorSlots[i]]);
			
		Costs.attach(item);
	}
	
	function prepareSheet(type, sheet) {
		setDefaults(sheet, {
			count: 1,
			size: [type.realFrameWidth, type.skin.frameHeight],
			lockChannels: "",
			row: [0, 1, 2, 3]
		});

		sheet.size = new Point(sheet.size);
		sheet.crop = new Rect(sheet.crop || sheet.size);
		sheet.thumbCrop = new Rect(sheet.thumbCrop || sheet.crop);

		setDefaults(sheet.defaultItem, { thumbCrop: sheet.crop } );
		
		sheet.dx = forceRowsCols(default_(sheet.dx, [[0]]), type.cols, function(v) {
			return type.realFrameWidth - v - sheet.size.x;
		});
		sheet.dy = forceRowsCols(default_(sheet.dy, [[0]]), type.cols);
		if (error) return;
		
		// rows
		sheet.row = forceRows(sheet.row, function(){ return 'm' });
		JAhas(sheet, [], ["rows"]);
		if (error) return;
		sheet.rows = 0;
		for(var i=0; i<type.rows; i++) {
			if (typeof sheet.row[i] == "number")
				sheet.rows = Math.max(sheet.rows, sheet.row[i]+1);
		}

		// cols
		if (def(sheet.col)) {
			JAhas(sheet, [], ["cols"]);
			sheet.col = forceRowsCols(sheet.col, type.cols);
			sheet.cols = 0;
			for(var i=0; i<type.rows; i++) {
				for(var j=0; j<type.cols; j++) {
					if (typeof sheet.col[i][j] == "number")
						sheet.cols = Math.max(sheet.cols, sheet.col[i][j]+1);
				}
			}			
		}else {
			JAhas(sheet, ["cols"]);
			if (error) return;
			var col = new Array(type.cols);
			for(var i=0; i<col.length; i++)
				col[i] = Math.min(i, sheet.cols-1);
			sheet.col = forceRows([col]);
		}
	}

	function prepareInitialMaxCost(parent, arr) {
		if (undef(arr))	// for derived colors
			return;
		var imc = Costs.big();
		for(var i=0; i<arr.length; i++) {
			if (Costs.orderLess(arr[i].cost, imc))
				imc = arr[i].cost;
		}
		Costs.attach(parent, "initialMaxCost");
		parent.initialMaxCost.gold = Math.max(parent.initialMaxCost.gold, imc.gold);
		parent.initialMaxCost.plut = Math.max(parent.initialMaxCost.plut, imc.plut);
	}

	function prepareFeature(type, fkey) {
		var feature = type.features[fkey];
		
		JAhas(feature, ["sheets"]);

		setDefaults(feature, {
			defaultItem: {},
			defaultSheet: {},
			defaultThumb: null,
			chanceEmpty: 0,
			dir: "",
			thumbScale: 1,
			thumbSize: [64],
			initialItem: null
		});
		if (feature.chanceEmpty == 0) {
			feature.initialChanceEmpty = default_(feature.initialChanceEmpty, 0);
			JA(feature.initialChanceEmpty == 0, "feature.initialChanceEmpty == 0");
		}else
			feature.initialChanceEmpty = default_(feature.initialChanceEmpty, feature.chanceEmpty);

		setDefaults(feature.defaultSheet, {	defaultItem: {}	});
		setDefaults(feature.defaultSheet.defaultItem, feature.defaultItem);
		
		feature.thumbSize = new Point(feature.thumbSize);
		
		JA(feature.chanceEmpty>=0 && feature.chanceEmpty<1, 
			"feature.chanceEmpty>=0 && feature.chanceEmpty<1");
		if (error) return;
		
		for(var skey in feature.sheets) {
			var sheet = feature.sheets[skey];		
			
			var excludeKeys = [];
			if (def(sheet.row) || def(sheet.rows)) {
				excludeKeys.push("row");
				excludeKeys.push("rows");
			}
			if (def(sheet.col) || def(sheet.cols)) {
				excludeKeys.push("col");
				excludeKeys.push("cols");
			}

			setDefaults(sheet, { defaultItem: {} });
			setDefaults(sheet, feature.defaultSheet, excludeKeys);
			setDefaults(sheet.defaultItem, feature.defaultSheet.defaultItem);
		
			prepareSheet(type, sheet);		
		
			if (error) return;
		}
		
		if(def(feature.items)) {
			for(var i=0; i<feature.items.length; i++) {				
				var item = feature.items[i];
				// optional "index" is used only to insure items positions won't change in the array
				if(def(item.index))
					JA(item.index == i, "item.index == i " + i);

				prepareItem(type, item, 
					feature.sheets[item.sheet || feature.defaultItem.sheet],
					feature);
			}
		}else {
			// items can be omitted if there is 1 item in 1 sheet
			JA(countKeys(feature.sheets) == 1, "countKeys(feature.sheets) == 1 " + fkey);
			var sheetKey = keyByIndex(feature.sheets, 0);
			JA(feature.sheets[sheetKey].count == 1, "feature.sheets[sheetKey].count == 1" + fkey);
			feature.items = [ { 
				cost: {},
				sheet: sheetKey,
				cell: 0
			} ];
			prepareItem(type, feature.items[0], feature.sheets[sheetKey], feature);
		}
		if (error) return;
		prepareInitialMaxCost(feature, feature.items);
	}

	function prepareColor(type, color, ckey) {
		switch(color.type) {
		case "main":
			color.rnd = color.rnd || [0, 255, 0, 255, 0, 255];
			break;
		case "optional":
			color.rnd = color.rnd || [0, 255, 0, 255, 0, 255];			
			JAhas(color, ["src", "chanceDerived"]);
			break;
		case "derived":
			JAhas(color, ["src"]);
			break;
		default:
			JA(0, "unknown color.type");
			break;
		}
		if (def(color.ifFeatures))
			JAhas(type.features, color.ifFeatures);
		setDefaults(color, {
			mul: 1,
			add: 0,
			shuffle: false,
			initialNotEmpty: false,
			"default": "808080",
			rareColorCost: type.editor.rareColorCost
		});	
		Costs.attach(color, "rareColorCost");
		var allValues = [];		
		color["default"] = killColorBits(type, ckey, hexColorToInt(color["default"]));
		if (color.type != "derived") {
			Costs.attach(color);
			// if custom cost if free, custom color is disabled
			Costs.attach(color, "customCost");
			color.presets = color.presets || [];
			for(var i=0; i<color.presets.length; i++) {
				var values = color.presets[i].values;
				for(var j=0; j<values.length; j++) {
					values[j] = killColorBits(type, ckey, hexColorToInt(values[j]));
					allValues.push(values[j]);
				}
				Costs.attach(color.presets[i]);
			}
		}
		allValues.sort();
		for(var i=1; i<allValues.length; i++) {
			JA(allValues[i-1] != allValues[i],
				"color values are not unique: "+type.code+" "+ckey);
		}
		prepareInitialMaxCost(color, color.presets);
	}	
	
	function prepareEditor(type) {
		JAhas(type, ["editor"]);
		if (error) return;
		var editor = type.editor;
		
		setDefaults(editor, {
			previewFrameWidth: type.skin.frameWidth,
			previewHeight: type.skin.frameHeight,
			rareColorCost: {"plut": 1}
		});
		Costs.attach(editor, "rareColorCost");
		
		editor.previewFrameSize = new Point(editor.previewFrameSize);
		
		JAhas(editor, ["features", "colors"]);
	}
	
	function preparePreset(type, preset) {
		setDefaults(preset, {
			colors: {}
		} );
		for(var ckey in preset.colors) {
			JAhas(type.colors, [ckey]);
			preset.colors[ckey] = killColorBits(type, ckey, hexColorToInt(preset.colors[ckey]));
		}
	}
	
	function prepareType(type) {
		JAhas(type, ["skin"]);
		if (error) return;
		
		setDefaults(type.skin, {
			frameHeight: type.skin.frameWidth,
			renderWidth: type.skin.frameWidth,
		});		
		
		setDefaults(type, {
			version: "0",
			realFrameWidth: type.skin.frameWidth,
			initialDiscount: {},
			initialDiscountMinRank: 1,
			blink: false,
			colors: {},
			presets: {},
			hsv: {},
			serialization: [{colors: [], features: []}]
		});
		Costs.attach(type, "initialDiscount");
		
		function rowLut(i) {
			return def(type.skin.row) ? type.skin.row[i] : i;
		}
		
		type.singleFileMode = def(type.singleFile);
		if (type.singleFileMode) {
			// TODO
			//throw "def(type.singleFile)";
		}else {
			// more complex analysis is not implemented yet
			JA(type.skin.animMirrorLeft != true, "type.skin.animMirrorLeft != true");
			if (error) return;
			
			type.symmRow = [];
			type.rowDirection = [];
			JA(type.rows == 4, "type.rows == 4");
			type.symmRow[rowLut(0)] = rowLut(2);
			type.symmRow[rowLut(1)] = rowLut(3);
			type.symmRow[rowLut(2)] = rowLut(0);
			type.symmRow[rowLut(3)] = rowLut(1);
			type.rowDirection[rowLut(0)] = "u";
			type.rowDirection[rowLut(1)] = "r";
			type.rowDirection[rowLut(2)] = "d";
			type.rowDirection[rowLut(3)] = "l";		
			
			for(var fkey in type.features) {
				prepareFeature(type, fkey);
				if (error) return;
			}
			
			prepareEditor(type);			
		}
			
		for(var ckey in type.colors) {
			prepareColor(type, type.colors[ckey], ckey);
			if (error) return;
		}
		
		for(var pkey in type.presets) {
			preparePreset(type, type.presets[pkey]);
			if (error) return;
		}
		
		setDefaults(type.hsv, {
			filterHue: [0, 360],
			modifyAddHue: 0
		});
		
		for(var i=0; i<type.serialization.length; i++) {
			var ser = type.serialization[i];
			setDefaults(ser, {
				encodingVersion: 0
			});
		}
	}
	
	function onLoadJson(data) {
		var types = {};
		for(var key in data) {
			error = false;				
			var type = data[key];
			type.code = key;
			prepareType(type);
			if (error) {
				console.log("Ctor: type '" + type.code + "' has an error");
			}else {
				type.dir = dir + type.dir;
				types[type.code] = type;
				console.log("Ctor: type '" + type.code + "' is loaded");
			}
		}
		onDone(types);
	}
	
	// initialization	
	var error;
		
	loadMultipleJsons(dir, skinConfigFiles, onLoadJson);
}

/**
 * @classdesc adds functionality to tranferrable types object
 * @constructor 
 * @param {processed json} types
 */
function SkinTypes(json) {
	this.types = json;
}

SkinTypes.prototype.killColorBits = function(tkey, ckey, value) {
	return killColorBits(this.types[tkey], ckey, value);
}

SkinTypes.prototype.enumFreeColorIds = function(tkey, ckey) {
	var res = [];
	var presets = this.types[tkey].colors[ckey].presets;
	for(var i=0; i<presets.length; i++) {
		var preset = presets[i];
		if (!Costs.isFree(preset))
			continue;
		for(var j=0; j<preset.values.length; j++) {
			res.push( new ColorId (
				tkey, ckey, preset.values[j]
			) );
		}
	}
	return res;
};

SkinTypes.prototype.enumAvailColorGroups = function(tkey, ckey, ownedColors) {
	var res = [];
	var presets = this.types[tkey].colors[ckey].presets;	
	for(var i=0; i<presets.length; i++) {
		var preset = presets[i];
		var group = {
			name: preset.name,
			cost: preset.cost,
			values: []
		};
		for(var j=0; j<preset.values.length; j++) {
			var value = preset.values[j];
			var color = new ColorId(tkey, ckey, value);
			if (indexByProp(ownedColors, color) < 0)
				group.values.push(value);
		}
		if (group.values.length > 0)
			res.push(group);
	}
	return res;
}

SkinTypes.prototype.enumFreeItemIds = function(tkey, fkey) {
	var res = [];
	var feature = this.types[tkey].features[fkey];
	var items = feature.items;
	for(var i=0; i<items.length; i++) {
		if (Costs.isFree(items[i]))
			res.push(new ItemId(tkey, fkey, i));
	}
	return res;
};

SkinTypes.selectRandomColorFromPresets = function(presets, maxCost) {
	var values = [];
	for(var i=0; i<presets.length; i++) {
		if (!Costs.orderLess(maxCost, presets[i].cost))
			values = values.concat(presets[i].values);
	}
	return values[randomInt(values.length)];
}

SkinTypes.prototype.selectRandomColorFromPresets = function(colorSlotId) {
	var color = this.getColor(colorSlotId);
	return SkinTypes.selectRandomColorFromPresets(color.presets, color.initialMaxCost);
}

SkinTypes.selectCheapestColorFromPresets = function(presets) {
	var cost = Costs.big();
	var values = [];
	
	for(var i=0; i<presets.length; i++) {
		if (Costs.orderLess(presets[i].cost, cost)) {
			values = [];
			cost = presets[i].cost;
		}
		if (!Costs.orderLess(cost, presets[i].cost))
			values = values.concat(presets[i].values);
	}
	return values[randomInt(values.length)];	
}

SkinTypes.prototype.getColor = function(id) {
	return this.types[id.type].colors[id.key];
};

SkinTypes.prototype.getFeature = function(id) {
	return this.types[id.type].features[id.key];
};

SkinTypes.prototype.getSheetKey = function(id) {
	return this.getFeature(id).items[id.index].sheet;
};

SkinTypes.prototype.getSheet = function(id) {
	var feature = this.getFeature(id);
	return feature.sheets[feature.items[id.index].sheet];
};

SkinTypes.prototype.getItem = function(id) {
	return this.getFeature(id).items[id.index];
};

/**
 * works for unprocessed json too
 */
SkinTypes.getUrlImage = function(type, name) {
	var res = type.dir + name + ".png";
	return isOnServer ? res : res + "?version=" + type.version;
}

SkinTypes.getUrl = function(type, feature, sheet) {
	return SkinTypes.getUrlImage(type, (feature.dir || "") + sheet.file);
}

SkinTypes.getUrlSingleFile = function(type) {
	return SkinTypes.getUrlImage(type, type.singleFile);
}

SkinTypes.prototype.getUrl = function(itemId) {
	var type = this.types[itemId.type];
	return SkinTypes.getUrl(type,
		type.features[itemId.key], this.getSheet(itemId));	
}

SkinTypes.prototype.colorUnlockCost = function(typeKey, ckey, colorsOwned) {
	var color = this.types[typeKey].colors[ckey];
	if (Costs.isFree(color) || indexByProp(colorsOwned, {type:typeKey, key:ckey}) < 0)
		return color.cost;
	return Costs.zero();
};

/**
 * @throws if color is custom, but custom colors are disabled
 */
SkinTypes.calcColorCost = function(value, presets, customCost) {
	for(var i=0; i<presets.length; i++) {
		var preset = presets[i];			
		if (preset.values.indexOf(value) >= 0)
			return preset.cost;
	}
	if (undef(customCost) || Costs.isZero(customCost)) // if custom color is disabled
		throw "Custom colors are disabled";
	return customCost;
};

SkinTypes.prototype.getInitialDiscount = function(tkey, hasSkin, rank) {
	return hasSkin || rank < this.types[tkey].initialDiscountMinRank
		? Costs.zero()
		: this.types[tkey].initialDiscount;
};

function getPublicFrame(skin) {
	return skin.publicFrame || [
		(skin.row ? skin.row[2] : 2) + (!skin.idleAnim ? 0 : skin.animMirrorLeft ? 3 : 4),
		skin.colStand != null ? skin.colStand :
			skin.col ? skin.col[0] :
			skin.animCount == 3 ? 1 : 0
	];
}