//====================== helper functions ========================

function intToRGB(v) {
	return {
		r: v & 0xff,
		g: (v>>8) & 0xff,
		b: (v>>16) & 0xff
	};
}

function RGBtoInt(v) {
	return v.r + (v.g<<8) + (v.b<<16);
}

// h = [0,360], s = [0,1], v = [0,1]
// if s == 0, then h = -1 (undefined)

function RGBtoHSV3(xr, xg, xb) {
	xr /= 255;
	xg /= 255;
	xb /= 255;	
	var min = Math.min(xr, xg, xb);
	var max = Math.max(xr, xg, xb);
	var result = {
		v: max
	};
	var delta = max - min;
	if (max == 0) {	// r = g = b = 0		
		result.s = 0; // s = 0, v is undefined
		result.h = -1;
		return result;
	}
	result.s = delta / max;		// s
	if (delta > 0) {
		if (xr == max)
			result.h = (xg - xb) / delta;		// between yellow & magenta
		else if (xg == max) 
			result.h = 2 + (xb - xr) / delta;	// between cyan & yellow
		else
			result.h = 4 + (xr - xg) / delta;	// between magenta & cyan
		result.h *= 60;				// degrees
		if( result.h < 0 )
			result.h += 360;
	}else 
		result.h = 0;
	return result;
}

function RGBtoHSV(x) {
	return RGBtoHSV3(x.r, x.g, x.b);
}

function HSVtoRGB3(xh, xs, xv) {
	v = ~~(xv * 255);
	if (xs == 0) // achromatic (grey)
		return {r:v, g:v, b:v};
	h = xh / 60;			// sector 0 to 5
	var i = Math.floor(h);
	var f = h - i;			// factorial part of h
	var p = ~~(v * (1 - xs));
	var q = ~~(v * (1 - xs * f));
	var t = ~~(v * (1 - xs * (1 - f)));
	switch (i) {
		case 0:	return { r:v, g:t, b:p };
		case 1: return { r:q, g:v, b:p };
		case 2: return { r:p, g:v, b:t };
		case 3: return { r:p, g:q, b:v };
		case 4: return { r:t, g:p, b:v };
		default:return { r:v, g:p, b:q };
	}
}

function HSVtoRGB(x) {
	return HSVtoRGB3(x.h, x.s, x.v);
}

/**
 * @classdesc Pseudorandom with seed
 * @param {int or sting} seed
 *		- if null, Math.random() is used
 */
function Random(seed) {

	// this.float = function() {
		// return my ? (myInt32() / 4294967296) + 0.5 : Math.random();
	// }
	
	this.int = function(maxPlus1) {
		return my ? myUint31()%maxPlus1 : Math.floor(maxPlus1 * Math.random());
	}
	
	this.float = function(maxPlus1) {
		return my ? myInt32()/4294967296+0.5 : Math.random();
	}	
	
	this.bool = function() {
		return my ? myInt32()%2==0 : Math.random()<0.5;
	}	
	
	function hashCode(str) {
		var hash = 0;
		if (str.length == 0) return hash;
		for (i = 0; i < str.length; i++) {
			char = str.charCodeAt(i);
			hash = ((hash<<5)-hash)+char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	function myInt32() {
		m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & 0xffffffff;
		m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & 0xffffffff;
		return ((m_z << 16) + m_w) & 0xffffffff;
	}
	
	function myUint31() {
		return myInt32() & 0x7fffffff;
	}	

	var m_z, m_w;	
	var my = def(seed);
	if (my) {
		m_z = 987654321;
		m_w = typeof seed == "string" ? hashCode(seed) : seed;
	}
}

/**
 * @classdesc Stores and manipulates config for one skin.
 *		Includes minimum function set for server side.
 *		- serialization/deserialization
 *		- cost calculation
 * @constructor 
 * @param {SkinTypes} skinTypes
 */
// TODO
// validate serialize config
// improve type codes
function SkinConfig(json) {
	this.skinTypes = new SkinTypes(json);
	this.types = json;
	this.colorSlots = {};
	this.itemSlots = {};
	this.postEffects = {};
	this.changed = false;
	this.camoColors = camoColors || [];
	this.items = {};
	SkinConfig.versionBits = 4;	
}

SkinConfig.prototype.getCurItem = function(fkey) {
	return this.skinTypes.getItem(this.itemSlots[fkey].id);
};

/**
 * Select previous item for a feature
 * @public
 * @param {string} fkey Feature that should be changed
 */
SkinConfig.prototype.setPrevItem = function(fkey) {
	var itemSlot = this.itemSlots[fkey];
	var itemsLength = this.type.features[fkey].items.length;
	itemSlot.id.index = (itemSlot.id.index - 1 + itemsLength) % itemsLength;
	this.changed = true;
};

/**
 * Select next item for a feature
 * @public
 * @param {string} fkey Feature that should be changed
 */
SkinConfig.prototype.setNextItem = function(fkey) {
	var itemSlot = this.itemSlots[fkey];
	var itemsLength = this.type.features[fkey].items.length;
	itemSlot.id.index = (itemSlot.id.index + 1) % itemsLength;
	this.changed = true;
};

SkinConfig.prototype.clearItem = function(fkey) {
	this.changed = this.changed || !this.itemSlots[fkey].empty;
	this.itemSlots[fkey].empty = true;
};

SkinConfig.prototype.setItem = function(id) {
	var itemSlot = this.itemSlots[id.key];
	var changed = !ItemId.equals(itemSlot.id, id) || itemSlot.empty;
	this.changed = this.changed	|| changed;
	itemSlot.id =  id;
	itemSlot.empty = false;
	return changed;	
};

SkinConfig.prototype.setItemUpdateColors = function(id, colorsOwned) {
	this.setItemUpdateColors_(false, id.key, id, colorsOwned);
}

SkinConfig.prototype.clearItemUpdateColors = function(ikey, colorsOwned) {
	this.setItemUpdateColors_(true, ikey, null, colorsOwned);
}

SkinConfig.prototype.setItemUpdateColors_ = function(setEmpty, ikey, id, colorsOwned) {
	var itemSlot = this.itemSlots[ikey];
	var changed = (setEmpty != itemSlot.empty) ||
		(!setEmpty && !ItemId.equals(itemSlot.id, id))
	this.changed = this.changed	|| changed;
	
	// find colors forced by this item
	var ckeysToChange = [];
	if (!itemSlot.empty) {
		var colors = this.skinTypes.getItem(itemSlot.id).colors;
		for(var ckey in colors) {
			var colorSlot = this.colorSlots[ckey];
			if (typeof colors[ckey] == "number" && this.isColorEnabled(ckey) &&
				colorSlot.value == colors[ckey])
			{
				var filter = new ColorId(this.typeKey, ckey, colorSlot.value);
				if (indexByProp(colorsOwned, filter) >= 0)
					continue;
				colorSlot.forced = true;
				if (changed)
					ckeysToChange.push(ckey);				
			}
		}
	}
	
	itemSlot.id =  id;
	itemSlot.empty = setEmpty;
	
	// force colors by new item
	if (!setEmpty && changed) {
		this.forceItemColorsById(id);
		var colors = this.skinTypes.getItem(itemSlot.id).colors;
		for(var ckey in colors) {
			var ind = ckeysToChange.indexOf(ckey);
			if (ind >= 0)
				ckeysToChange.splice(ind, 1);
		}
	}
	
	// force items colors removal
	for(var i=0; i<ckeysToChange.length; i++) {
		var ckey = ckeysToChange[i];
		var colorSlot = this.colorSlots[ckey];
		var lnfv = colorSlot.lastNotForcedValue;
		var colorSlotId = new ColorId(this.typeKey, ckey);
		if (def(lnfv) && lnfv >= 0) {
			this.setColorValue(ckey, lnfv);
		}else if (this.skinTypes.getColor(colorSlotId).type == "optional") {
				this.setColorEnabled(ckey, false);
		}else {
			var fci = this.skinTypes.enumFreeColorIds(this.typeKey, ckey);
			if (fci.length == 0)
				fci = filtrByProp(colorsOwned, colorSlotId);
			if (fci.length > 0) {
				this.setColorValue(ckey, fci[0].value);
			}else {
				// do nothing, let the color remain
			}
		}
		colorSlot.forced = false;
	}	
};

SkinConfig.prototype.isItemOptional = function(fkey) {
	return this.type.features[fkey].chanceEmpty > 0;
};

SkinConfig.prototype.isItemFlippable = function(fkey) {
	if (!this.getItemEnabled(fkey))
		return false;
	return this.getCurItem(fkey).flippable;
};

SkinConfig.prototype.flip = function(fkey) {
	this.changed = this.changed || this.isItemFlippable(fkey);
	this.itemSlots[fkey].flip = !this.itemSlots[fkey].flip;
};


SkinConfig.prototype.getItemEnabled = function(fkey) {
	return !this.itemSlots[fkey].empty;
};

// only for the old UI
SkinConfig.prototype.setItemEnabled = function(fkey, enabled) {
	var changed = this.itemSlots[fkey].empty != !enabled;
	this.changed = this.changed || changed;
	this.itemSlots[fkey].empty = !enabled;
};

SkinConfig.prototype.isColorOptional = function(ckey) {
	return this.type.colors[ckey].type == "optional";
};

SkinConfig.prototype.isColorSlotEnabled = function(ckey) {
	var color = this.type.colors[ckey];
	if (undef(color.ifFeatures))
		return true;
	for(var i=0; i<color.ifFeatures.length; i++) {
		var fkey = color.ifFeatures[i];
		if (this.getItemEnabled(fkey) &&
			this.getCurItem(fkey).colorSlots.indexOf(ckey) >= 0)
		{
			return true;
		}
	}
	return false;
	// TODO derived - ?
	//case "derived":
	//	return this.isColorSlotEnabled(color.src);
};

SkinConfig.prototype.isColorEnabled = function(ckey) {
	var cs = this.colorSlots[ckey];
	return this.isColorSlotEnabled(ckey) && !cs.derived
		// crutch for colors not deserialized because of item slots
		&& def(cs.value) && cs.value >= 0;
};

SkinConfig.prototype.setColorEnabled = function(ckey, enabled) {
	//if (!(!enabled || this.isColorSlotEnabled(ckey)))
	//assert(!enabled || this.isColorSlotEnabled(ckey), "!enabled || this.isColorSlotEnabled(ckey)");
	//assert(this.isColorSlotEnabled(ckey), "this.isColorSlotEnabled(ckey)");
	this.changed = this.changed || this.colorSlots[ckey].derived != !enabled;
	this.colorSlots[ckey].derived = !enabled;
};

SkinConfig.prototype.getColorValue = function(ckey) {
	return this.colorSlots[ckey].value;
};

SkinConfig.prototype.setColorValue = function(ckey, value) {
	//assert(this.isColorSlotEnabled(ckey), "this.isColorSlotEnabled(ckey)");
	if (value <0)
		assert(value >= 0, "SkinConfig.prototype.setColorValue value >= 0");
	this.changed = this.changed || this.colorSlots[ckey].value != value;
	this.colorSlots[ckey].value = value;
};


SkinConfig.prototype.createItemSlotForType = function(tkey, fkey, empty, flip, index) {
	return {
		empty: default_(empty, this.types[tkey].features[fkey].chanceEmpty > 0),
		flip: default_(flip, false),
		id: new ItemId(tkey, fkey, default_(index, 0))
	};
}

SkinConfig.prototype.createItemSlot = function(fkey, empty, flip, index) {
	return this.createItemSlotForType(this.typeKey, fkey, empty, flip, index);
}

SkinConfig.prototype.createDefaultColorSlot = function(ckey) {
	switch( this.type.colors[ckey].type ) {
	case "main":
		return {
			derived: false,
			value:  default_(this.type.colors[ckey]["default"], 0x808080)
		};
	//case "attached":
	//	// TODO ????????????????????????????
	default:
		return {
			derived: true
		};
	}	
}

/**
 * Get the sheet selected for a feature
 * @public
 * @param {string} fkey Feature
 * @returns Sheet
 */

SkinConfig.prototype.getSheetKey = function(fkey) {	
	return this.skinTypes.getSheetKey(this.itemSlots[fkey].id);
};

SkinConfig.prototype.getSheet = function(fkey) {	
	return this.skinTypes.getSheet(this.itemSlots[fkey].id);
};

SkinConfig.splitCode = function(src) {
	if (src.length < 2 || (src[0]!='!' && src[0]!='?'))
		throw "incorrect skin code";	
	var tokens = src.split("-");
	var typeAndData = tokens[0].substring(1);
	
	tokens.splice(0, 1);
	
	var i = typeAndData.indexOf('!');
	if (i < 0) {
		return {
			type: typeAndData[0],
			data: typeAndData.substring(1),
			options: tokens
		};
	}else {
		return {
			type: typeAndData.substring(0, i),
			data: typeAndData.substring(i + 1),
			options: tokens
		};
	}
}

/**
 * Serializes skin into string
 * @returns {String}
 * @see deserialize() for more info
 */
SkinConfig.prototype.serialize = function() {
	var s = new Serializer();
	
	var serVer = this.type.serialization.length - 1;
	var ser = this.type.serialization[serVer];
	
	s.write(serVer, SkinConfig.versionBits);
	
	for(var i=0; i<ser.features.length; i++) {
		var sf = ser.features[i];
		var fkey = sf.key;
		s.writeBool(this.itemSlots[fkey].empty);
		if (this.itemSlots[fkey].empty)
			continue;				
		s.write(this.itemSlots[fkey].id.index, sf.bits);
		s.writeBool(this.itemSlots[fkey].flip);
	}
	
	for(var i=0; i<ser.colors.length; i++) {
		var sc = ser.colors[i];
		var ckey = sc.key;
		var colorSlot = this.colorSlots[ckey];
		if (this.isColorSlotEnabled(ckey)) {
			if (this.isColorOptional(ckey))
				s.writeBool(colorSlot.derived);
			if (this.isColorEnabled(ckey))
				s.writeColor(this.getColorValue(ckey), sc.bits);
		}
	}

	s.writeCrc();
	
	return "!"
		+ this.typeKey
		+ (this.typeKey.length > 1 ? '!' : '')
		+ s.result64();
}

/**
 * Deserializes skin from string
 *
 * src format: ?<type> or !<type>[<data>]
 * <type> consists of 1 leter or 2+ letters followed by "!"
 * 
 * If it is impossible:
 *	- throws "invalid skin code" exception
 *	- retains last valid config
 * @param src64 {String} Skin code. Format:
 *		src64[0] = '!' - you can identify skin fro constructor with that
 *		src64[1] = skin type code
 *		src64[2...] = base-64 encoded skin config
 */
SkinConfig.prototype.deserialize = function(src64) {
	this.requestedCode = src64;
	if (src64[0] == '?') {
		this.setRandomFeatures(SkinConfig.splitCode(src64).type, src64);
		this.setRandomColors(src64);
		return;
	}
	
	var ex = "invalid skin code";
	var splitted = SkinConfig.splitCode(src64);
	if (undef(splitted.type))
		throw ex;
	
	var oldItemSlots = this.itemSlots;
	var oldColorSlots = this.colorSlots;
	var oldTypeKey = this.typeKey;
	var oldType = this.type;
	var oldPostEffects = this.postEffects;
	
	try {
		this.typeKey = splitted.type;
		this.type = this.types[this.typeKey];
		
		this.itemSlots = {};
		this.colorSlots = {};		
		var s, serCfg;
		
		if (splitted.data.length > 0) {
			s = new Serializer(splitted.data);
			var version = s.read(SkinConfig.versionBits);
			assert(version < this.type.serialization.length);
			serCfg = this.type.serialization[version];
	
			for(var i=0; i<serCfg.features.length; i++) {
				var sf = serCfg.features[i];
				var fkey = sf.key;
				var itemSlot = this.itemSlots[fkey] = {};
				itemSlot.empty = s.readBool();
				if (itemSlot.empty) {
					this.itemSlots[fkey] = this.createItemSlotForType(splitted.type, fkey);
					assert(itemSlot.empty, "new itemSlot.empty");
					continue;
				}
				var feature = this.type.features[fkey];
				
				itemSlot.id = new ItemId(
					splitted.type,
					fkey,
					s.read(sf.bits)
				);
				assert(itemSlot.id.index < feature.items.length);
	
				itemSlot.flip = s.readBool();				
			}
		}

		for(var fkey in this.type.features)
			this.itemSlots[fkey] = this.itemSlots[fkey] || this.createItemSlot(fkey);
		
		if (splitted.data.length > 0) {
			for(var i=0; i<serCfg.colors.length; i++) {
				var sc = serCfg.colors[i];
				var ckey = sc.key;
				var color = this.type.colors[ckey];
				var colorSlot = this.colorSlots[ckey] = {};
				var colorSlotEnabled = this.isColorSlotEnabled(ckey);
							
				if (def(sc.legacyOptional)) {
					// currently used only for hamsters spots2 color
					assert(serCfg.encodingVersion < 1, "serCfg.encodingVersion < 1");
					var derived = s.readBool();
					colorSlot.derived = false;
					colorSlot.value =
						derived
						? this.colorSlots[sc.legacyOptional].value
						: s.readColor(sc.bits);
					continue;
				}
				
				switch (this.type.colors[ckey].type) {
				case "main":
					colorSlot.derived = false;
					break;
				case "optional":
					colorSlot.derived =
						colorSlotEnabled || serCfg.encodingVersion < 1
						? s.readBool()
						: true; // value doesn't matter?
					break;
				case "derived":
					colorSlot.derived = true;
					break;
				}
				if (!colorSlot.derived) {
					colorSlot.value =
						colorSlotEnabled || serCfg.encodingVersion < 1
						? s.readColor(sc.bits)
						: null; // SkinTypes.selectCheapestColorFromPresets(color.presets);
				}
			}
			s.readValidateCrc();			
		}
		
		for(var ckey in this.type.colors) {
			if (undef(this.colorSlots[ckey]))
				this.colorSlots[ckey] = this.createDefaultColorSlot(ckey);
		}
		
		this.postEffects = {};
		for(var i=0; i<splitted.options.length; i++)
			this.applyOption(splitted.options[i]);
	}catch(e) {
		this.itemSlots = oldItemSlots;
		this.colorSlots = oldColorSlots;
		this.typeKey = oldTypeKey;
		this.type = oldType;
		this.postEffects = oldPostEffects;
		
		console.log(e);
		throw ex;
	}
	
	this.changed = true;
}

/**
 * Applies options to skin after it was deserialized.
 * Supported options:
 * p<preset> - overrides some colors (possibly items in future versions)
 * @throws if option is unsupported
 */
SkinConfig.prototype.applyOption = function(option) {
	var code = option[0]
	var value = option.substring(1);
	switch(code) {
	case "p":	// apply preset
	case "t":	// apply team preset, don't throw if it doesn't exist
		var preset = this.type.presets[value];
		if (undef(preset)) {
			if (code == "p") {
				throw "unknown skin preset";
			}else
				return;
		}		
		for(var ckey in preset.colors) {
			this.setColorValue(ckey, preset.colors[ckey]);
		}
		if (def(preset.addHue)) {
			this.postEffects.addHue = preset.addHue;
		}
		break;
	default:
		throw "unknown skin option";
	}
}

SkinConfig.prototype.getCurItemIds = function() {
	var res = [];
	for(var fkey in this.itemSlots) {
		var x = this.itemSlots[fkey];
		if (x.empty)
			continue;		
		res.push(this.itemSlots[fkey].id);
	}
	return res;
}

SkinConfig.prototype.getCurColorIds = function() {
	var res = [];
	for(var ckey in this.colorSlots) {
		if (!this.isColorEnabled(ckey))
			continue;
		var x = this.colorSlots[ckey];
		res.push(new ColorId(this.typeKey, ckey, x.value));
	}
	return res;
}

SkinConfig.prototype.enumCurItemColorIds = function(ckey) {
	var res = [];
	for(var fkey in this.itemSlots) {
		if (this.getItemEnabled(fkey)) {
			var color = this.getCurItem(fkey).colors[ckey];
			if (typeof color == "number")
				res.push(new ColorId(this.typeKey, ckey, color));
		}
	}
	return res;
}

/**
 * Get cost of the item selected for a feature
 *
 * @public
 * @param {string} fkey Feature
 * @param {bool} getIfEmpty Optional - should we got cost>0 if this item is disabled
 * @returns Cost
 */
SkinConfig.prototype.getItemSlotCost = function(fkey, getIfEmpty) {
	if (this.itemSlots[fkey].empty && !getIfEmpty)
		return Costs.zero();
	return this.skinTypes.getItem(this.itemSlots[fkey].id).cost;	
};


/**
 * @throws if color is custom, but custom colors are disabled
 */
SkinConfig.prototype.apprise = function(itemsOwned, colorsOwned, discount) {	
	var result = {
		items: [],
		colors: [],
		cost: Costs.zero()
	};
	
	var curItems = this.getCurItemIds();
	for(var i=0; i<curItems.length; i++) {
		var v = curItems[i];
		if (indexByProp(itemsOwned, v) >= 0)
			continue;
		var cost = this.getItemSlotCost(v.key);
		if (Costs.isZero(cost))
			continue;
		result.items.push([v.type, v.key, v.index]);
		Costs.add(result.cost, cost);
	}
	
	var curColors = this.getCurColorIds();
	for(var i=0; i<curColors.length; i++) {
		var v = curColors[i];
		if (indexByProp(colorsOwned, v) >= 0 ||
			indexByProp(this.enumCurItemColorIds(v.key), v) >= 0)
			continue;
		var color = this.skinTypes.getColor(v);
		var cost = SkinTypes.calcColorCost(v.value, color.presets, color.customCost);
		var unlockCost = this.skinTypes.colorUnlockCost(v.type, v.key, colorsOwned);
		if (Costs.isZero(cost) && Costs.isZero(unlockCost))
			continue;
		// do not add free colors (e.g. from items) if we only need to unlock the slot
		result.colors.push([v.type, v.key, Costs.isZero(cost) ? DUMMY_COLOR : v.value]);
		Costs.add(result.cost, cost);
		Costs.add(result.cost, unlockCost);
	}
	
	Costs.applyDiscount(result.cost, discount);
	return result;
}

SkinConfig.prototype.createTypeCode = function(tkey) {
	var typeInd;
	var kc = countKeys(this.types);
	if (def(this.typeKey)) {
		typeInd = indexOfKey(this.types, this.typeKey)
	}else {
		do {
			typeInd = randomInt(kc);
		}while( undef(propByIndex(this.types, typeInd).editor) );
	}
	if (def(tkey)) {
		switch(tkey) {
		case "prev":
		case "next":
			var step = tkey=="prev" ? kc - 1 : 1;
			do {
				typeInd = (typeInd + step) % kc;				
			}while( undef(propByIndex(this.types, typeInd).editor) );
			break;
		case "?":
			do {
				typeInd = randomInt(kc);
			}while( undef(propByIndex(this.types, typeInd).editor) );
			break;			
		case "same":
			break;
		default:
			typeInd = indexOfKey(this.types, tkey);
		}
	}
	return keyByIndex(this.types, typeInd);
}

SkinConfig.prototype.setType = function(tkey) {
	tkey = this.createTypeCode(tkey);
	if (this.typeKey == tkey)
		return;		
	this.typeKey = tkey;
	this.type = this.types[this.typeKey];
		
	var type = this.type;
	
	this.itemSlots = {};
	for(var fkey in this.type.features) {
		var feature = this.type.features[fkey];
		this.itemSlots[fkey] = this.createItemSlot(fkey);
	}
	
	this.colorSlots = {};
	for(var ckey in type.colors) {
		this.colorSlots[ckey] = {
			derived: type.colors[ckey].type != "main",
			value: type.colors[ckey]["default"]
		};
	}
	this.changed = true;
}

/**
 * Randomize skin parameters (except colors)
 * @public
 * @param {string} typeKey - May contain type key
 *		or one of the special values: "rand", "prev", "next", "same"
 *		Default value: "rand"
 */
SkinConfig.prototype.setRandomFeatures = function(typeKey, seed, isInitialRandom) {
	var rand = new Random(seed);
	if (typeKey == "?") {
		do {
			this.typeKey = keyByIndex(this.types, rand.int(countKeys(this.types)));
		}while( undef(this.types[this.typeKey].editor) );
	}else
		this.typeKey = this.createTypeCode(typeKey);
	this.type = this.types[this.typeKey];
	
	this.itemSlots = {};
	for(var fkey in this.type.features) {
		if (this.type.editor.features.indexOf(fkey) < 0) {
			this.itemSlots[fkey] = this.createItemSlot(fkey);
			continue;
		}
		
		var feature = this.type.features[fkey];

		// create item for this feature
		if (isInitialRandom) {
			var freeId = randomElement(this.skinTypes.enumFreeItemIds(this.typeKey, fkey));
			var itemIndexes = [];
			if (feature.initialItem != null) {
				itemIndexes = [feature.initialItem];
			}else {
				for(var i=0; i<feature.items.length; i++) {
					if (Costs.canAfford(feature.initialMaxCost, feature.items[i].cost))
						itemIndexes.push(i);
				}
			}
			this.itemSlots[fkey] = this.createItemSlot(
				fkey,
				feature.chanceEmpty > 0 && rand.float() < feature.initialChanceEmpty,
				rand.bool(), 
				def(freeId) ? freeId.index : randomElement(itemIndexes));
		}else {
			do {
				this.itemSlots[fkey] = this.createItemSlot(
					fkey,
					rand.float() < feature.chanceEmpty,
					rand.bool(), 
					rand.int(feature.items.length));
			}while(this.getCurItem(fkey).cost.plut > 9000);
		}
	}		
	this.changed = true;
};


SkinConfig.prototype.makeItemsAffordable = function(maxCost, itemsOwned, colorsOwned, discount) {
	var ck = countKeys(this.itemSlots);
	for(var i=0; i<20; i++) {
		var appraisal = this.apprise(itemsOwned, colorsOwned, discount);
		if (Costs.canAfford(maxCost, appraisal.cost))
			break;

		var sn;
		do {
			sn = randomInt(ck);
		}while(this.type.editor.features.indexOf(keyByIndex(this.itemSlots, sn)) < 0);

		var success = false;
		for(var j=0; j<ck; j++, sn=(sn+1)%ck) {
			// try to make item slot cheaper
			var fkey = keyByIndex(this.itemSlots, sn);
			var slot = this.itemSlots[fkey];
			if (this.type.editor.features.indexOf(fkey) < 0 || slot.empty)
				continue;			
			var curCost = this.getItemSlotCost(fkey);
			var feature = this.type.features[fkey];			
			var cheaperItems = [];
			for(var k=0; k<feature.items.length; k++)
				if (Costs.orderLess(feature.items[k].cost, curCost))
					cheaperItems.push(k);
			if (cheaperItems.length) {
				slot.id.index = cheaperItems[randomInt(cheaperItems.length)];
				success = true;
				break;
			}else if (feature.initialChanceEmpty > 0) {
				slot.empty = true;
				success = true;
				break;				
			}
		}
		if (!success)
			break;
	}
	this.changed = true;
}

SkinConfig.prototype.forceItemColorsById = function(id) {
	var colors = this.skinTypes.getItem(id).colors;
	for(var ckey in colors) {
		if (typeof colors[ckey] == "number") {
			if (!this.colorSlots[ckey].forced) {
				this.colorSlots[ckey].lastNotForcedValue = 
					this.isColorEnabled(ckey)
					? this.colorSlots[ckey].value
					: -1;
			}
			this.setColorValue(ckey, colors[ckey]);
			this.setColorEnabled(ckey, true);
			this.colorSlots[ckey].forced = true;
		}
	}
}

SkinConfig.prototype.forceItemColors = function(fkey) {
	this.forceItemColorsById(this.itemSlots[fkey].id);
}

/**
 * @public
 */
SkinConfig.prototype.setRandomColors = function(seed, isInitialRandom, onlyUndefined) {
	var rand = new Random(seed);
	function random(item) {
		var r = item.rnd[0] + rand.int(item.rnd[1]-item.rnd[0]+1);
		var g = item.rnd[2] + rand.int(item.rnd[3]-item.rnd[2]+1);
		var b = item.rnd[4] + rand.int(item.rnd[5]-item.rnd[4]+1);
		if (item.shuffle) {
			var p;
			switch(rand.int(3)) {
			case 0: p=r; r=g; g=p; break;
			case 1: p=r; r=b; b=p; break;
			case 2: break;
			}
			if (rand.bool()) { p=g; g=b; b=p; }
		}
		return r + (g<<8) + (b<<16);
	}
	
	var type = this.type;
	if (!onlyUndefined)
		this.colorSlots = {};
	for(var ckey in type.colors) {
		if (this.type.editor.colors.indexOf(ckey) < 0) {
			this.colorSlots[ckey] = this.createDefaultColorSlot(ckey);
			continue;
		}
		var color = type.colors[ckey];
		var colorSlot = this.colorSlots[ckey] = this.colorSlots[ckey] || {};
		if (typeof colorSlot.derived == "undefined") {
			switch(color.type) {
			case "main":
				colorSlot.derived = false;
				break;
			case "optional":
				colorSlot.derived = isInitialRandom || rand.float() < color.chanceDerived;
				break;
			case "derived":
				colorSlot.derived = true;
				break;
			}
		}
		if (typeof colorSlot.value != "number") {
			colorSlot.value =
				!this.isColorSlotEnabled(ckey)
				?	SkinTypes.selectCheapestColorFromPresets(color.presets)
				:	isInitialRandom
					? SkinTypes.selectRandomColorFromPresets(color.presets, color.initialMaxCost)
					: 	rand.float() < 0.75
						? SkinTypes.selectRandomColorFromPresets(color.presets, Costs.big())
						: random(color);
			if (colorSlot.value == null) colorSlot.value = random(color); // if no presets
		}
	}
	for(var fkey in this.itemSlots) {		
		if (this.getItemEnabled(fkey) && rand.float() < 0.75)
			this.forceItemColors(fkey);
	}
	this.changed = true;
}

/**
 * @public
 */
SkinConfig.prototype.setDefaultColors = function() {
	var type = this.type;
	this.colorSlots = {};
	for(var ckey in type.colors) {
		var color = type.colors[ckey];
		this.colorSlots[ckey] = this.colorSlots[ckey] || {};
		var thisColor = this.colorSlots[ckey];
		switch(color.type) {
		case "main":
		case "optional":		
			thisColor.derived = false;
			break;
		case "derived":		
			thisColor.derived = true;
			break;
		}
		if (!thisColor.derived) {
			thisColor.value = color["default"];
		}
	}
	this.changed = true;
}

/**
 * @public
 */
SkinConfig.prototype.overrideColors = function(colors) {
	if (colors == null)
		return;
	var type = this.type;
	for(var ckey in colors) {
		this.colorSlots[ckey].value = colors[ckey];
		this.changed = true;
	}
}

/**
 * @protected
 */
SkinConfig.prototype.deriveColors = function(extraColors) {
	// anti-camouflage
	/*camoColors = camoColors || [];

	var camoMargin = [32, 40, 48, 56, 64, 64, 64];
	var camoH = [0, -20, 20, -10, 10, 15, -15];
	var camoV = [0, 0.1, -0.1, 0.2, -0.2, -0.15, 0.15];

	var camoIndex = [];
	var camoRGB = [];
	for(var i=0; i<this.camoColors.length; i++) {
		camoIndex.push(0);		
		camoRGB.push(intToRGB(hexColorToInt(this.camoColors[i])));
	}

	function antiCamo(iv) {
		var v = intToRGB(iv);
		for(var i=0; i<this.camoColors.length; i++) {
			var cv = camoRGB[i];
			var d = Math.sqrt((v.r-cv.r)*(v.r-cv.r) + (v.g-cv.g)*(v.g-cv.g) + (v.b-cv.b)*(v.b-cv.b));
			var ci = camoIndex[i];
			if (d < camoMargin[ci]) {
				var hsv = RGBtoHSV(v);
				hsv.v =
					hsv.v > 0.7
					? hsv.v - Math.abs(camoV[ci])
					: hsv.v < 0.3
						? hsv.v + Math.abs(camoV[ci])
						: hsv.v + camoV[ci]
				hsv.h = (hsv.h + 360 + camoH[ci]) % 360;
				v = HSVtoRGB(hsv);
				iv = RGBtoInt(v);
				camoIndex[i] = Math.min(ci+1, camoMargin.length-1);
				break;
			}
		}
		return iv;
	}*/
	function antiCamo(iv) { return iv; }

	function derive(item, parent, parent2) {
		var v = intToRGB(parent.finalValue);
		
		if (parent2 != null) {
			var v2 = intToRGB(parent2.finalValue);
			v.r = (v.r + v2.r) >> 1;
			v.g = (v.g + v2.g) >> 1;
			v.b = (v.b + v2.b) >> 1;
		}
		
		if (def(item.hue) && !parent.derived) {
			var hsv = RGBtoHSV(v);
			if (hsv.h >= 0) {
				hsv.h = (hsv.h + item.hue + 360) % 360;
				v = HSVtoRGB(hsv);
			}
		}
		
		var mulAdd = Math.min(2, Math.max(0.5, (v.r+v.g+v.b+1+3*item.add)/(v.r+v.g+v.b+1) ));
		var mul = item.mul * mulAdd;
		item.finalValue = RGBtoInt( {
			r: Math.min(255, Math.floor(v.r * mul)),
			g: Math.min(255, Math.floor(v.g * mul)),
			b: Math.min(255, Math.floor(v.b * mul))			
		} );
		return item.finalValue;
	}
	
	// find all color changes
	var colrChanges = {};
	for(var fkey in this.itemSlots) {
		if (this.getItemEnabled(fkey)) {
			var colors = this.getCurItem(fkey).colors;
			for(var ckey in colors) {
				if (typeof colors[ckey] != "number")
					colrChanges[ckey] = colors[ckey];
			}
		}
	}
	// after overriding colors changes go to colorSlots
	var colors = this.colorSlots;
	for(var ckey in colors) {
		if (typeof colors[ckey].value != "number" && colors[ckey].value != null) {
			colrChanges[ckey] = colors[ckey].value;
			colors[ckey].derived = true;
		}
	}

	var type = this.type;
	// backward to insure body camo color will be changed
	var ckeys = [];
	for(var ckey in type.colors)
		ckeys.push(ckey);
	for(var i=ckeys.length-1; i>=0; i--) {
		ckey = ckeys[i];
		if (!this.colorSlots[ckey].derived)
			this.colorSlots[ckey].finalValue = antiCamo(this.colorSlots[ckey].value);
	}
	for(var ckey in type.colors) {
		if (this.colorSlots[ckey].derived) {
			var tc = colrChanges[ckey] || type.colors[ckey];
			var parent = this.colorSlots[tc.src];
			if (undef(parent))
				continue;
			var parent2 = def(tc.src2) ? this.colorSlots[tc.src2] : null;
			this.colorSlots[ckey].finalValue = derive(tc, parent, parent2);
		}
	}
}

SkinConfig.prototype.getThumbSize = function(fkey) {
	return this.type.features[fkey].thumbSize;
};

SkinConfig.prototype.enumThings = function() {
	this.things = {};
			
	var dontRenderTags = [];
	for(var fkey in this.type.features) {
		if (this.getItemEnabled(fkey))
			dontRenderTags = dontRenderTags.concat(this.getCurItem(fkey).dontRenderTags);
	}
	
	for(var fkey in this.type.features) {
		if (this.getItemEnabled(fkey) && dontRenderTags.indexOf(this.getCurItem(fkey).tag) < 0)
			this.things[fkey] = {};
	}
}

/**
 * @protected
 */
SkinConfig.prototype.calcSize = function(minWidth, minHeight) {
	var type = this.type;
	
	var rect = [];
	for(var i=0; i<type.rows; i++)
		rect.push( {
			l: 0, 
			u: 0, 
			r: type.skin.frameWidth, // inclusive
			d: type.skin.frameHeight // inclusive
		} );
		
	var sumShiftSkinX = 0, sumShiftSkinY = 0;
	
	// find shifts for each feature
	var shifts = {};
	for(var fkey in this.things) {
		var thing = this.things[fkey];
		var sheet = this.skinTypes.getSheet(this.itemSlots[fkey].id);
		var item = this.skinTypes.getItem(this.itemSlots[fkey].id);
		for(var key in item.shiftTags)
			shifts[key] = item.shiftTags[key];
		thing.dx = sheet.dx;
		thing.dy = sheet.dy;
		var us = shifts[item.tag];
		if (us != null) {
			thing.dx = clone(thing.dx);
			thing.dy = clone(thing.dy);
			for(var i=0; i<type.rows; i++) {
				var signx = this.itemSlots[fkey].flip
						&& ("ud".indexOf(type.rowDirection[i])>=0) ? -1 : 1;
				for(var j=0; j<type.cols; j++) {
					thing.dx[i][j] += signx * us.dx[i][j];
					thing.dy[i][j] += us.dy[i][j];
				}
			}
		}
	}
	
	// find bounding rects for each row
	for(var fkey in this.things) {
		var thing = this.things[fkey];
		var sheet = this.skinTypes.getSheet(this.itemSlots[fkey].id);
		var item = this.skinTypes.getItem(this.itemSlots[fkey].id);
		
		sumShiftSkinX += item.shiftSkinX;
		sumShiftSkinY += item.shiftSkinY;

		for(var i=0; i<type.rows; i++) {
			for(var j=0; j<type.cols; j++) {
				if (typeof thing.dx[i][j] == "number") {
					rect[i].l = Math.min(rect[i].l,	Math.max(
						Math.min(rect[i].l, thing.dx[i][j]),
						-item.widen));
					rect[i].r = Math.max(rect[i].r,	Math.min(
						Math.max(rect[i].r, thing.dx[i][j] + sheet.crop.w), 
						type.skin.frameWidth + item.widen));
				}
				if (typeof thing.dy[i][j] == "number") {
					rect[i].u = Math.min(rect[i].u, Math.max(
						Math.min(rect[i].u, thing.dy[i][j]),
						-item.heighten));
					rect[i].d = Math.max(rect[i].d, Math.min(
						Math.max(rect[i].d, thing.dy[i][j] + sheet.crop.h), 
						type.skin.frameHeight + item.heighten));
				}				
			}
		}
	}

	// center bounding rects for each row
	this.dx = new Int16Array(type.rows);
	this.dy = new Int16Array(type.rows);	
	for(var i=0; i<type.rows; i++) {
		this.dy[i] = sumShiftSkinY;
		rect[i].u += sumShiftSkinY;
		rect[i].d += sumShiftSkinY;
		rect[i].u = Math.min(rect[i].u, type.skin.frameHeight - rect[i].d);
		rect[i].d = Math.max(rect[i].d, type.skin.frameHeight - rect[i].u);
		var rd = type.rowDirection[i];
		if (rd == "r" || rd == "l") {
			var d = sumShiftSkinX * (rd == "r" ? 1 : -1);
			this.dx[i]	= d;
			rect[i].l += d;
			rect[i].r += d;
			rect[i].l = Math.min(rect[i].l, type.skin.frameWidth - rect[i].r);
			rect[i].r = Math.max(rect[i].r, type.skin.frameWidth - rect[i].l);
		}
	}
	
	// find skin size
	var l = rect[0].l;
	var u = rect[0].u;	
	var r = rect[0].r;
	var d = rect[0].d;
	for(var i=1; i<type.rows; i++) {
		l = Math.min(rect[i].l, l);
		u = Math.min(rect[i].u, u);
		r = Math.max(rect[i].r, r);
		d = Math.max(rect[i].d, d);
	}
	// shift skin so everything is positive
	for(var i=0; i<type.rows; i++) {
		this.dx[i] -= l;
		this.dy[i] -= u;
	}
	// result
	this.width	= r - l;
	this.height	= d - u;	
	
	if (def(minHeight)) {
		for(var i=0; i<type.rows; i++) {
			if (this.width < minWidth)
				this.dx[i] += ~~((minWidth - this.width)/2);
			if (this.height < minHeight)
				this.dy[i] += ~~((minHeight - this.height)/2);
		}
		this.width	= Math.max(this.width, minWidth);
		this.height	= Math.max(this.height, minHeight);
		return;
	}
	
	//this.dx = this.dy = null;
	
	this.skinW	= this.width * type.cols;
	this.skinH	= this.height * type.rows;	
}