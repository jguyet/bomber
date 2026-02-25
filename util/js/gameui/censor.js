/**
 * @classdesc Manages all censors
 *		supports lazy censor initialization
 * @constructor 
 */
function CensorManager() {
	var censors = {};
	
	var MIN_SIGNIF_PART = 0.25;
	var NICK_SIGNIF_LENGTH = 2;

	/**
	 * Calls process for each censor
	 * @see Censor.process
	 * @public
	 * @param {String} str Message
	 * @param {Array} nicks Array of nicks
	 * @param {Array} Languages Keys of censor configs
	 * @returns {object} processed message for author and others
	 */
	this.process = function(str, nicks, languages) {		
		if (!languages || languages.length==0)
			return str;
			
		updateNickExp(nicks);		
		var parts = splitByNicks(str, nicks, nickExp);

		if (languages.indexOf("caps") >= 0)
			removeCaps(parts);
		
		var partsLength = 0;
		for(var i=0; i<parts.length; i++) {
			if (parts[i].nick)
				continue;
			parts[i].str = shortenAAAAAA(parts[i].str, 10);
			partsLength += str.length;
		}
		
		function checkCondition(condition) {
			if (!condition)
				return true;
			for(var i=0; i<parts.length; i++) {
				if (!parts[i].nick && parts[i].str.search(condition) >= 0)
					return true;
			}
			return false;
		}
		
		for(var j=0; j<languages.length; j++) {
			var lang = languages[j].replace("?", "");
			var config = this.configs[lang];
			if (!config)
				continue;
			if (lang != languages[j] && !checkCondition(config.condition))
				continue;
			if (!censors[lang])
				censors[lang] = new Censor(config);				
			var bad = false;
			var signifLength = 0;
			for(var i=0; i<parts.length; i++) {
				if (parts[i].nick) {
					signifLength += NICK_SIGNIF_LENGTH;
					continue;
				}
				if (parts[i].str.search(/\S/) < 0)
					continue;
					
				var res = censors[lang].process(parts[i]);
				if (res.evil)
					return "";
				signifLength = signifLength + (res.signifLength || 0);
				bad = bad || res.bad;
			}			
			if (bad && signifLength < partsLength * MIN_SIGNIF_PART)
				return "";
		}
			
		var result = "";
		for(var i=0; i<parts.length; i++)
			result += parts[i].str;
		return result;
	}
	
	var escapeAllExp = /([\(\{\[\)\}\]\/\|\*\+\?\-\$\^\:\=\!\\])/g;
	function escapeAll(str) {
		return str.replace(escapeAllExp, "\\$1");
	}
	
	var nickExp;
	var lastNicksLength = 0;
	function updateNickExp(nicks) {
		if (lastNicksLength == nicks.length)
			return;
		lastNicksLength = nicks.length;
		if (nicks.length) {
			var pat = "";
			for(var i=0; i<nicks.length; i++)
				pat += (i ? "|" : "") + "@" + escapeAll(nicks[i]);
			nickExp = new RegExp(pat, "g");
		}else		
			nickExp = null;
	}
	
	function splitByNicks(str, nicks, nickExp) {
		var parts = [];
		while(str != "") {
			var ind = nickExp ? str.search(nickExp) : -1;
			if (ind < 0) {
				parts.push( {
					nick: false, 
					str: str
				} );
				break;
			}
			// there is some nick at ind. which one?
			var nickEnd;
			for(var i=0; i<nicks.length; i++) {
				nickEnd = ind+1+nicks[i].length;
				if (str.substring(ind+1, nickEnd) == nicks[i])
					break;
			}
			if (ind > 0) {
				parts.push( {
					nick: false, 
					str: str.substring(0, ind)
				} );
			}
			parts.push( {
				nick: true,
				str: str.substring(ind, nickEnd)
			} );
			str = str.substring(nickEnd);
		}
		return parts;
	}

	//var removeSymbolsExp = /[\s\d~`\!@#\$%\^&\*\(\)_\-\+\=\{\[\}\]\:;"'<\,>\.\?\|\/\\]/g;		
	function removeCaps(parts) {
		var totalCAPS = 0;
		var totalLow = 0;
		for(var i=0; i<parts.length; i++) {
			if (parts[i].nick)
				continue;
			//var str = parts[i].str.replace(removeSymbolsExp, "");
			var str = parts[i].str;
			var strCAPS = str.toUpperCase();
			var strLow = str.toLowerCase();
			for(var j=0; j<str.length; j++) {
				if (str[j] != strCAPS[j])
					totalLow++;
				else if (str[j] != strLow[j])
					totalCAPS++;
			}			
		}
		if (totalCAPS <= 2 || (totalLow>0 && totalCAPS<=15) )
			return;
		for(var i=0; i<parts.length; i++) {
			if (!parts[i].nick)
				parts[i].str = parts[i].str.toLowerCase();
		}
	}
	
	function shortenAAAAAA(str, max) {
		if (str.length == 0)
			return "";

		var result = str[0];
		var counter = 1;
		for(var i=1; i<str.length; i++) {
			counter = str[i]==str[i-1] ? counter+1 : 1;
			if (counter <= max)
				result += str[i];
		}
		return result;
	}	
}

/**
 * Retains configs for all languages
 * 		Individual configs are added in the front/com/censorconfigs files
 */
CensorManager.prototype.configs = {};

/**
 * @classdesc Search & replace profanity
 * @constructor 
 * @param config_ Complete config for one language.
 */
function Censor(config_) {
	
	function createTransMap(from, to) {
		var map = {};
		for (var i=0; i<from.length; i++) {
			map[from[i]] = to[i];
		}
		return map;
	}
	
	function expandPattern(s, options, chars) {
		
		function expandCharSet(s) {
			if (s === '.') {
				return {
					value: '.',
					canMergeWithSep: false,
					hasSep: true
				}
			}
			var res = "";
			var chng = false;
			var noBrackets = s[0] !== '[';
			var canMergeWithSep = options.separators && (noBrackets || s[1] !== '^');
			var hasSep = false;
			for(var i=0; i<s.length; i++) {
				var c = s[i];
				if (c === '\\') {
					i++;
					res += c + s[i];
				}else {
					if (chars[c]) {
						res += chars[c];
						chng = true;
					}else if (canMergeWithSep && c === ' ') {
						res += config.separatorChars;
						hasSep = true;
						chng = true;
					}else {
						res += c;
					}
				}
			}
			return {
				value: (noBrackets && chng) ? '['+res+']' : res,
				canMergeWithSep: canMergeWithSep,
				hasSep: hasSep
			}
		}
			
		function separatorForItem(item) {
			return item.hasSep
				? item.value
				: '[' + config.separatorChars +
					( item.canMergeWithSep
					? (item.value[0]==='[' ? item.value.substr(1)+'*' : item.value+']*')
					: ']*');
		}
		
		function setSep(i, before, after) {
			items[i].canSepAfter = items[i].canSepBefore = false;
			items[i].sepBefore = before;
			items[i].sepAfter = after;
		}
	
		var stackLength = 0;
		var items = [];
		var sectionStart;
		var composite = false;
		
		for(var i=0; i<s.length; i++) {
			var c = s[i];
			var quant = null;
			if (stackLength == 0) {
				if("([{".indexOf(c) >= 0) {
					sectionStart = i;
					stackLength++;
				}else if("*+?".indexOf(c) >= 0) {
					quant = c;
				}else if("^$|".indexOf(c) >= 0) {
					items.push({
						value: c,
						nonString: true
					});					
					composite = composite || c == '|';					
				}else {
					if (c == '\\') {
						c += s[++i];						
					}else if (c == ' ')
						c = "\\s";
					items.push(expandCharSet(c));
				}
			}else {
				if (c == '\\') {
					i++; // to skip the escaped brackets
				}else if("([{".indexOf(c) >= 0) {
					stackLength++;
				}else if(")]}".indexOf(c) >= 0) {
					stackLength--;
					if (stackLength == 0) {
						switch(c) {
						case ")":
							var nonCapturing = s[sectionStart+1] == '?';
							var lookAhead = nonCapturing && "=!".indexOf(s[sectionStart+2]) >= 0;
							var innerStart = sectionStart + (nonCapturing ? 3 : 1);
							items.push({
								value: s.substring(sectionStart, innerStart) +
									expandPattern(s.substring(innerStart, i), options, chars).str + ")",
								nonString: lookAhead,
								quant: ""
							});
							break;
						case "]":
							items.push(expandCharSet(s.substring(sectionStart, i+1)));
							break;
						case "}":
							quant = s.substring(sectionStart, i+1);
							break;
						}
					}
				}
			}
			if (quant) {
				if (s[i+1] == '?') { // greedy quantifier
					quant += '?';
					i++;
				}
				items[items.length-1].quant = quant;
			}
		}
		if (stackLength != 0)
			throw "censor: stackLength != 0 " + s;
		
		for(var i=0; i<items.length; i++) {
			var item = items[i];
			if (!item.nonString) {
				var q = item.quant;
				if (options.repeat && q == null)
					q = item.quant = "+";			
				item.quantPositive = q==null || q=="" || q[0]=='+' || (q[0]=='{' && q[1]!='0');
				item.quantInfinite = q && q.match(/\+|\{\d+\,\}/);
				item.canMergeWithSep = item.canMergeWithSep && item.quantInfinite;
			}
		}
		
		if (options.separators) {
			// where CAN we insert separators?
			var f = false;
			for(var i=items.length-1; i>=0; i--) {
				items[i].canSepAfter = f;
				f = !items[i].nonString && (f || items[i].quantPositive);
			}
			f = false;
			for(var i=0; i<items.length; i++) {
				items[i].canSepBefore = f;
				f = !items[i].nonString && (f || items[i].quantPositive);
			}
			for(var i=0; i<items.length-1; i++) {
				items[i].canSepAfter = items[i].canSepAfter && items[i+1].canSepBefore;
				items[i+1].canSepBefore = items[i+1].canSepBefore && items[i].canSepAfter;
			}
			
			// where SHOULD we insert separators?
			for(var i=0; i<items.length; i++) {
				var item = items[i];
				if (item.hasSep)
					// it'll count as separators at both sides
					setSep(i, true, true);
				else if (item.canMergeWithSep && options.repeat) {
					// choose the only side for separators mixed with item
					if (!item.canSepAfter && item.canSepBefore)
						setSep(i, true);
					else if (item.canSepAfter && !item.canSepBefore)
						setSep(i, false, true);
				}
			}
			// choose a free side for separators mixed with item
			for(var i=1; i<items.length; i++) {
				if (items[i].canMergeWithSep && items[i].canSepAfter && items[i-1].sepAfter)
					setSep(i, false, true);
			}
			for(var i=items.length-2; i>=0; i--) {
				if (items[i].canMergeWithSep && items[i].canSepBefore && items[i+1].sepBefore)
					setSep(i, true);
			}
			// fill remaining gaps
			for(var i=1; i<items.length; i++) {
				if (items[i].canSepBefore && !items[i-1].sepAfter)
					setSep(i, true);
				else if (items[i-1].canSepAfter && !items[i].sepBefore)
					setSep(i-1, false, true);
			}
			if (options.repeat) {
				// insert separator mixed with item even if there is one at this side
				for(var i=0; i<items.length; i++) {
					if (items[i].canMergeWithSep) {
						if (items[i].canSepBefore)
							setSep(i, true);
						else if (items[i].canSepAfter)
							setSep(i, false, true);
					}
				}
			}
		}
		
		var dst = "";
		for(var i=0; i<items.length; i++) {
			var item = items[i];
			if (item.nonString) {
				dst += item.value;
			}else {
				var t = "";
				if (item.sepBefore && !item.hasSep)
					t += separatorForItem(item);
				t += item.value;
				if (item.quant)
					t += items[i].quant;
				if (item.sepAfter && !item.hasSep)
					t += separatorForItem(item);
				dst += t;
			}				
		}
		return {str: dst, composite: composite};
	}
	
	function setDefaults(obj, defaults) {
		for(var dkey in defaults) {
			if (obj[dkey] == null) {
				obj[dkey] = defaults[dkey];
			}
		}
	}
	
	function createPatternFor(group, words, chars) {
		var result = "";
		var composite = words.length > 1;
		setDefaults(group, {
			repeat: true,
			separators: true,
			part: " x "
		} );
		for(var i=0; i<words.length; i++) {
			var v = expandPattern(words[i], group, chars, true);
			result += (i ? "|" : "") + v.str;
			composite = composite || v.composite;
		}
			
		function boundaryExp(ch, capt) {
			switch(ch) {
			case ' ': return "(" + capt + config.wordBoundary + ")";
			case 'x': return "(" + capt + "\\S)";
			case '.': return "";
			default:  throw "censor: invalid part " + group.part;
			}
		}
		var before = boundaryExp(group.part[0], "");
		var after  = boundaryExp(group.part[2], "?=");
		if ((before+after).length) {
			if (composite)
				result = "(?:" + result + ")"
			result = before + result + after;
		}

		return result;
	}
	
	function createTo(group) {
		if (group.part[0] != '.') {
			var to = group.to;
			var result = "$1";
			for(var i=0; i<to.length; i++) {
				if (i > 0 && to[i-1] == '$')
					result += String.fromCharCode(to.charCodeAt(i) + 1);
				else
					result += to[i];
			}
			return result;
		}else
			return group.to;
	}
	
	function createRegExps(list, chars) {
		var regExps = [];
		for(var i=0; i<list.length; i++) {
			var pat = createPatternFor(list[i], list[i].words, chars);
			var flags = "g" + (list[i].sensCase ? "" : "i");
			var group = { from: new RegExp(pat, flags) };
			// validae regexp
			if ("     ".search(group.from)>=0 || "".search(group.from)>=0) {
				throw "censor: regexp matches an empty string " + group.from;
				continue;
			}
			if (typeof list[i].to == "string")
				group.to = createTo(list[i]);
			if (list[i].condition)
				group.condition = createPatternFor(list[i], list[i].condition, chars);
			regExps.push(group);
		}
		return regExps;
	}
	
	function transliterate(str, map) {
		var result = "";
		for (var i=0; i<str.length; i++)
			result += map[str[i]] || str[i];
		return result;
	}
	
	/**
	 * Replaces profanity
	 * @public
	 */
	this.process = function(part) {

		function replace(str, exps, to) {
			for(var i=0; i<exps.length; i++) {
				var to_ = to || exps[i].to;
				if (to_) {
					if (exps[i].condition && original.search(exps[i].condition) < 0)
						continue;
					str = str.replace(exps[i].from, to_);
				}
			}
			return str;
		}
		
		function removeSpaces() {
			if (part.str.length>=2 && part.str[0]==' ' && part.str[part.str.length-1]==' ')
				part.str = part.str.substring(1, part.str.length-1);
		}		
		
		part.str = " " + part.str + " ";
		var original = part.str;
		
		// STEP 1 - "bad" replacements
		// The purpose of this step is to try to preserve meaning while neutralizing profanities
		
		// remove replaced words from the set of significant words
		var signifStr = replace(part.str, badExps, "\x07");
		// check if there are any such words
		var bad = (signifStr != part.str);		
		// replace words
		if (bad)
			part.str = replace(part.str, badExps);
		
		// STEP 2 - is there anything significant?
		// if there is only "bad" and insignificat in all parts, the entire message will be hidden
		var signifStr = transliterate(signifStr, transGood);
		var signifStr = replace(signifStr, insignifExps, "\x07");
		var signifStr = signifStr.replace(removeInsignifExp, " ");
		var signifStr = signifStr.replace(separatorExp, "");
		if (signifStr.length == 0) {
			removeSpaces();
			return { bad: bad };
		}
		
		// STEP 3 - deal with bad words that survived "bad" replacements
		// if there is anything bad in any part, the entire message will be hidden
		// The purpose of this step is to block profanities at all cost
		
		// exclude known good words that migh look like bad words
		// only if they use correct characters
		var newStr = transliterate(part.str, transGood);
		newStr = replace(newStr, goodExps, " ");		
		// normalize all similar-looking characters
		newStr = transliterate(newStr, transEvil);
		// find any bad word
		for(var i=0; i<evilExps.length; i++) {
			if (evilExps[i].condition && newStr.search(evilExps[i].condition) < 0)
				continue;		
			if (newStr.search(evilExps[i].from) >= 0)
				return { evil: true };
		}
		
		removeSpaces();
		return { bad: bad, signifLength: signifStr.length };
	}
	
	var config = config_;
	
	var removeInsignifExp = new RegExp(
		"[^"+config.separatorChars+"]*\x07+[^"+config.separatorChars+"]*", "g");
	var separatorExp = new RegExp("["+config.separatorChars+"]*", "g");
	
	// prepare trasliteration
	var transGood = createTransMap(config.transGoodFrom, config.transGoodTo);
	var transEvil  = createTransMap(config.transEvilFrom, config.transEvilTo);
	
	// prepare reg exps
	var badExps		= createRegExps(config.bad, config.chars);
	var insignifExps= createRegExps(config.insignificant, config.chars);
	var goodExps 	= createRegExps(config.good, config.chars);
	var evilExps	= createRegExps(config.evil, config.charsBad);
}