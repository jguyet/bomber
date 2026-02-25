bombermine.controller('ConstructorCtrl', function($http, $scope, $rootScope, $location, i18nFilter, Game, skinModel) {

	_gaq.push(['_setCustomVar', 1, 'user_load_constructor', $scope.user.id, 1]);
	
	var selectedSlotColor = "#70d2fc";
	var slotColor = "rgba(0, 0, 0, 0)";
	
	var baseDir = "/ctor/";
	
	var scale;
	// adjust perview size to window size
	function adjustPreviewSize() {
		if ($(window).height() >= 650) {
			var skinCanvas = document.getElementById("skinCanvas");
			var previewCanvas = document.getElementById("preview");
			$scope.skinCanvasWidthAdd = skinCanvas.width;
			$scope.skinCanvasHeightAdd = 110;
			$scope.sizeClass = "'double-size'";
			scale = 2;
			previewCanvas.width -= skinCanvas.width;
			previewCanvas.height += skinCanvas.height + 10;
			skinCanvas.width *= 2;
			skinCanvas.height *= 2;
		}else {
			$scope.skinCanvasHeightAdd = $scope.skinCanvasWidthAdd = 0;
			$scope.sizeClass = "";
			scale = 1;
		}
	}
	
	$scope.costIsZero = function(cost) {
		return undef(cost) || Costs.isZero(cost);
	}
	
	/**
	 * Retrieves owned colors & items for all skin types
	 * @param {function()} onload - callback when loaded
	 */
	function serverGetOwned(onLoad) {
		$http.get('/api/ctor/owned_all').success(
			function(data) {
				itemsOwned = data.items;
				colorsOwned = data.colors;
				skinModel.setCtorConfigs(data.configs);
				skinModel.dirty = true; // because of ctor_configs
				$scope.ctor.blocked = false;
				onLoad();
			}
		);
	}
	
	function createColorPicker() {
		Utils.whenExist("pickerInput", function(inp) {
			var pickerOptions = {
				pickerPosition: 'top',
				pickerFaceColor: '#F3F3F3',
				pickerInsetColor: 'black',
				pickerBorderColor: 0,
				pickerBorder: 1
				//minV: 0.1,
				//maxV: 0.9
				//pickerBorder: 0
				// pickerFace:	4,
				// pickerFaceColor: 'transparent',			
			};
			picker = new jscolor.color(inp, pickerOptions);
			pickerInterval = setInterval($scope.pickColor, 50);
		});
	}

	/**
	 * Used in color shop tmpl
	 */	
	$scope.colorValueToThumbStyle = function(value) {
		return {
			"background-color": intColorToHtml(value)
		};
	}	
	
	$scope.getName = function(item) {
		var lang = $scope.currentLocale;
		if (undef(item.name))
			return "";
		if (def(item.name[lang]))
			return item.name[lang];
		if (def(item.name["en"]))
			return item.name["en"];
		return "";
	}
	
	function showSkin(result) {
		Utils.whenExist("skinCanvas", function(c) {
			var skin = result.skin;
			var canvas = result.canvas;
			
			var ctx = c.getContext("2d");
			ctx.clearRect(0, 0, c.width, c.height);
			if (!canvas) {
				alert(i18nFilter("c_error_images"));
				/*  GA */	_gaq.push(['_trackEvent', 'Character', 'error_skin', 'errorSkin'+ skin]);
				return;
			}
			
	//		Game.previewSetSkin("editor");
			skin.name = "editor";
			sprites.addSpriteWithCanvas(canvas, skin);		
			skin = skin.skin;
			var dx, dy;
			function updateSize(w, h) {
				if (c.width < w)
					c.width = w;
				if (c.height < h)
					c.height = h;
				dx = (c.width  - w) >> 1;
				dy = (c.height - h) >> 1;		
			}
			var sw = skin.frameWidth;
			var sh = skin.frameHeight;
			var cw = Math.max(skinConfig.type.editor.previewFrameSize.x, sw);
			var ch = Math.max(skinConfig.type.editor.previewFrameSize.y, sh);		
			var cwa = Math.max(skinConfig.type.editor.previewFrameSize.x - sw, 0);
			var cha = Math.max(skinConfig.type.editor.previewFrameSize.y - sh, 0);
			updateSize(2 * scale * cw, 2 * scale * ch);
			var dw = def(skin.colStand) ? skin.colStand * sw  : 0;		
			ctx.imageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.mozImageSmoothingEnabled = false;
			ctx.drawImage(canvas,
				dw, 2*sh, sw, sh,
				((3*cwa)>>1)+scale*sw+dx, (cha>>1)+dy,
				scale*sw, scale*sh);
			ctx.drawImage(canvas,
				dw, 0, sw, sh,
				((3*cwa)>>1)+scale*sw+dx, ((3*cha)>>1)+scale*sh+dy,
				scale*sw, scale*sh);
			ctx.drawImage(canvas,
				dw, 1*sh, sw, sh,
				(cwa>>1)+dx, (cha>>1)+dy,
				scale*sw, scale*sh);
			ctx.drawImage(canvas,
				dw, 3*sh, sw, sh,
				(cwa>>1)+dx, ((3*cha)>>1)+scale*sh+dy,
				scale*sw, scale*sh);
				
			/*  GA */	_gaq.push(['_trackEvent', 'Character', 'show_skin', 'show skin on canvas'+ skin]);
		});
	}

	function userMoney() {
		return Costs.create($scope.user.gold, $scope.user.plutonium);
	}

	function calcDiscount() {
		return skinTypes.getInitialDiscount(
			skinConfig.typeKey,
			findConfig() != null, 
			$scope.user.rank
		);		
	}
	
	function updateScopeCost() {
		$scope.ctor.costItemSlots = [];
		$scope.ctor.costColorSlots = [];
	
		$scope.ctor.costItems = Costs.zero();
		for(var i=0; i<$scope.features.length; i++) {
			var slot = $scope.features[i];
			if (!slot.isEnabled())
				continue;
			var selectedCost = slot.getSelectedItem().cost;
			Costs.add($scope.ctor.costItems, selectedCost);			
			if (!Costs.isZero(selectedCost))
				$scope.ctor.costItemSlots.push(slot);
		}		

		$scope.ctor.costColors = Costs.zero();
		for(var i=0; i<$scope.colors.length; i++) {
			Costs.add($scope.ctor.costColors, $scope.colors[i].cost);
			if (!Costs.isFree($scope.colors[i]))
				$scope.ctor.costColorSlots.push($scope.colors[i]);
		}
		$scope.ctor.discount = calcDiscount();

		$scope.ctor.cost = Costs.zero();
		Costs.add($scope.ctor.cost, $scope.ctor.costColors);
		Costs.add($scope.ctor.cost, $scope.ctor.costItems);
		Costs.applyDiscount($scope.ctor.cost, $scope.ctor.discount);

		//$scope.ctor.buyBtnStyle = Costs.canAfford(userMoney(), $scope.ctor.cost)
		//	? {}
		//	: { "background-color": "gray" };
		
		/*  GA */	_gaq.push(['_trackEvent', 'Character', 'price_updated', 'Price Updated']);		
	}
	
	function noSkin() {
		return $scope.ctor.noColors || $scope.ctor.noItems;
	}
	
	function updateBtnVisibility() {
		if (skinConfig.changed)
			$scope.ctor.buyBtnVisible = true;
		if (skinConfig.serialize() == $scope.user.skin)
			$scope.ctor.buyBtnVisible = false;	
	}
	
	function afterChange() {
		if (noSkin()) return;
		updateScopeCost();
		updateBtnVisibility();
		var obj = {name: skinConfig.serialize()};
		console.log("Skin name: " + obj.name);
		skinBuilder.build(obj, showSkin);
		//skinConfig.updateSkin();
		/*  GA */	_gaq.push(['_trackEvent', 'Character', 'update_skin', 'After skinConfig.updateSkin();']);
	}
	
	function createEditorItems() {
		var tkey = skinConfig.typeKey;		
		
		$scope.features = [];
		var list = skinConfig.type.editor.features;
		for(var i=0; i<list.length; i++) {
			var fkey = list[i];
			var featureId = new ItemId(tkey, fkey);
			var items = skinThumbs.genAllThumbs(new ItemId(tkey, fkey));
			// owned items are free
			for (var j=items.length-1; j>=0; j--) {
				for (var k=0; k<itemsOwned.length; k++) {
					if (ItemId.equals(items[j].id, itemsOwned[k])) {
						items[j].cost = Costs.zero();
						break;
					}
				}
				if (items[j].cost.plut > 9000 && ($scope.user.perm_mask & 4) == 0)
					items.splice(j, 1);
			}
			// stable sort, free and new first
			for (var j=0; j<items.length; j++) {
				items[j].sortKey = Costs.isFree(items[j]) ? j :
					items[j].item["new"] ? j + 1000 : j + 2000;
			}
			items.sort(function(a, b) { return a.sortKey - b.sortKey; });

			var slot = {
				key:		fkey,
				name:		$scope.getName(skinTypes.getFeature(featureId)),
				optional:	skinConfig.isItemOptional(fkey),
				size: 		skinConfig.getThumbSize(fkey),
				items:		items,
				selectedInd:	null,
				isEnabled:		function() { return this.selectedInd >= 0; },
				getSelectedItem: 		function() { return this.items[this.selectedInd]; }
			};
			$scope.features.push(slot);
		}
		buildThumbs();
	}
	
	function createEditorColors() {
		var tkey = skinConfig.typeKey;
		$scope.colors = [];
		var list = skinConfig.type.editor.colors;		
		for(var i=0; i<list.length; i++) {
			var ckey = list[i];
			var colorSlotId = new ColorId(tkey, ckey);
			var color = skinTypes.getColor(colorSlotId);
			var boughtIds = filterByProp(colorsOwned, colorSlotId);
			
			var unlockCost = skinTypes.colorUnlockCost(tkey, ckey, boughtIds);
			// DUMMY_COLOR is used when slot is unlocked with some free color
			// remove them after using for unlocking
			spliceByProp(boughtIds, {value: DUMMY_COLOR});
			
			function createGroup(i18key, values) {
				return {
					name: i18nFilter(i18key),
					cost: Costs.zero(),
					values: values || [],
					commonCost: false
				};
			}

			var gropFree	= createGroup("c_colors_free_purchased",
								arrayOfElemtntsProp(boughtIds, "value"));
			var gropItems	= createGroup("c_colors_items", 
								 arrayOfElemtntsProp(skinConfig.enumCurItemColorIds(ckey), "value"));
			var gropCommon	= createGroup("c_colors_common");
			var gropRare	= createGroup("c_colors_rare");
			var gropsCommon	= [];
			var gropsRare	= [];
			var gropsNamed	= [];
			var avilGroups = skinTypes.enumAvailColorGroups(tkey, ckey, boughtIds);
			
			//var rareCost = skinConfig.type.editor.rareColorCost;
			var rareCost = color.rareColorCost;
			// ad json groups to visual groups
			for(var j=0; j<avilGroups.length; j++) {
				var group = avilGroups[j];
				if (def(group.name)) {
					group.name = $scope.getName(group);
					gropsNamed.push(group);
				}else if (Costs.isFree(group)) {
					gropFree.values = gropFree.values.concat(group.values);
				}else if (Costs.orderLess(group.cost, rareCost)) {
					gropsCommon.push(group);
				}else {
					gropsRare.push(group);
				}
			}
			
			function addGruops(titleGroup, subGroups) {
				if (subGroups.length==0)
					return;
				// if all subgroups have the save price, merge them
				var allEquals = true;
				for(var i=1; i<subGroups.length; i++)
					allEquals = allEquals && Costs.equals(subGroups[i].cost, subGroups[i-1].cost);
				if (allEquals) {
					for(var i=1; i<subGroups.length; i++)
						subGroups[0].values = subGroups[0].values.concat(subGroups[i].values);
					subGroups = [subGroups[0]];
					subGroups[0].commonCost = true;
					titleGroup.commonCost = true;
					titleGroup.cost = subGroups[0].cost;
				}
				// add result
				groups.push(titleGroup);
				groups = groups.concat(subGroups);				
			}
			
			var groups = [];
			if (gropFree.values.length)
				groups.push(gropFree);
			if (gropItems.values.length)
				groups.push(gropItems);
			groups = groups.concat(gropsNamed);
			addGruops(gropCommon, gropsCommon);
			addGruops(gropRare, gropsRare);			
			
			var slot = {
				id:			new ColorId(tkey, ckey, -1),
				name:		$scope.getName(color),
				optional:	skinConfig.isColorOptional(ckey),
				customCost:	color.customCost,				
				cost:		null,
				baseUnlockCost:	unlockCost,
				unlockCost:	null,
				style:		null,
				availGroups:	groups,
				isEnabled:	function() { return this.id.value >= 0; }
			};			
			
			$scope.colors.push(slot);			
		}
	}
	
	function itemSlotStyle(slot, index) {
		return { "border-color":
			index == slot.selectedInd ? selectedSlotColor : slotColor
		};
	}	
	
	function updateEditorItems() {
		$scope.ctor.noItems = false;
		var curItems = skinConfig.getCurItemIds();
		for(var i=0; i<$scope.features.length; i++) {
			var slot = $scope.features[i];
			var featureId = new ItemId(skinConfig.typeKey, slot.key);
			if (skinConfig.getItemEnabled(slot.key)) {
				var id = elementByProp(curItems, featureId);
				slot.selectedInd = indexByProp(slot.items, {"id": id});
			}else {
				slot.selectedInd = -1;
			}
			if (slot.selectedInd < 0 && !slot.optional)
				$scope.ctor.noItems = true;
			// update styles
			for(var j=0; j<slot.items.length; j++)
				slot.items[j].style = itemSlotStyle(slot, j);
			slot.emptyStyle = itemSlotStyle(slot, -1);
		}
		
		/*  GA */	_gaq.push(['_trackEvent', 'Character', 'update_items', 'updateEditorItems() fired']);
	}
	
	function updateEditorColors(chanceAllowCustom) {
		chanceAllowCustom = default_(chanceAllowCustom, 1);

		function findSomeColor(groups) {
			var n = 0;
			for(var i=0; i<groups.length; i++)
				n += groups[i].values.length;
			n = randomInt(n);
			for(var i=0; i<groups.length; i++) {
				var v = groups[i].values;
				if (n < v.length)
					return v[n];
				n -= v.length;
			}
		}
	
		for(var i=0; i<$scope.colors.length; i++) {
			var slot = $scope.colors[i];
			
			if (!skinConfig.isColorSlotEnabled(slot.id.key)) {
				// TODO why??????
				Costs.attach(slot);
				//slot.cost = new Cost(slot.cost);
				continue;
			}
			
			// crutch for colors not deserialized because of item slots
			if (skinConfig.isColorSlotEnabled(slot.id.key) &&
				!skinConfig.isColorOptional(slot.id.key) &&
				!skinConfig.isColorEnabled(slot.id.key))
			{
				skinConfig.setColorValue(
					slot.id.key,
					SkinTypes.selectCheapestColorFromPresets(slot.availGroups)
				);
			}
			
			if (skinConfig.isColorEnabled(slot.id.key)) {
				slot.id.value = skinConfig.getColorValue(slot.id.key);
				try {	// try to find preset
					slot.cost = SkinTypes.calcColorCost(slot.id.value, slot.availGroups, null);
				}catch(e) { // this is custom cost
					if (!Costs.isZero(slot.customCost) && Math.random() < chanceAllowCustom) {
						slot.cost = slot.customCost;
					}else {
						slot.id.value = findSomeColor(slot.availGroups);
						slot.cost = SkinTypes.calcColorCost(slot.id.value, slot.availGroups, null);
					}
				}
			}else {
				slot.id.value = -1;
				slot.cost = Costs.zero();
			}

			slot.unlockCost = indexByProp(skinConfig.enumCurItemColorIds(slot.id.key), 
					slot.id ) >= 0
				? Costs.zero()
				: slot.baseUnlockCost;
			if (slot.id.value >= 0) {
				// TODO why?
				Costs.attach(slot);
				//slot.cost = new Cost(slot.cost);
				Costs.add(slot.cost, slot.unlockCost);
				slot.style = $scope.colorValueToThumbStyle(slot.id.value);
			}
		}
		
		/*  GA */	_gaq.push(['_trackEvent', 'Character', 'update_colors', 'updateEditorColors() fired']);
	}
	
	function updateSkinItems() {
		for(var i=0; i<$scope.features.length; i++) {
			var slot = $scope.features[i];
			if (slot.isEnabled()) {
				skinConfig.setItemUpdateColors(slot.getSelectedItem().id, colorsOwned);
			}else
				skinConfig.clearItemUpdateColors(slot.key, colorsOwned);
		}
		
		/*  GA */	_gaq.push(['_trackEvent', 'Character', 'update_skin_items', 'updateSkinItems() fired']);
	}
	
	function updateSkinColors() {
		for(var i=0; i<$scope.colors.length; i++) {
			var slot = $scope.colors[i];
			if (!skinConfig.isColorSlotEnabled(slot.id.key))
				continue;			
			skinConfig.setColorEnabled(slot.id.key, slot.isEnabled());
			if (slot.isEnabled())
				skinConfig.setColorValue(slot.id.key, slot.id.value);
		}
		
		//for each item slot create list of color slots
		//TODO: rewrite in ExcuseMe style
		for (var i=0; i<$scope.features.length; i++) {
			var feature = $scope.features[i];
			feature.colorSlots = [];
			if (feature.isEnabled()) {
				var item = skinTypes.getItem(feature.getSelectedItem().id);
				for (var j=0; j<$scope.colors.length; j++) {
					var colorSlot = $scope.colors[j];
					if (item.colorSlots.indexOf(colorSlot.id.key) >= 0)
						feature.colorSlots.push(colorSlot);
				}
			}
		}
	}
	
	function syncItemsChange() {
		updateSkinItems();
		updateEditorItems();
		createEditorColors();
		updateEditorColors();
		updateSkinColors(); // we could have lost item colors
		afterChange();
	}
	
	function syncColorsChange() {
		updateSkinColors();
		updateEditorColors();
		afterChange();
	}
	
	function syncSkinChange(chanceAllowCustom) {
		createEditorItems();
		updateEditorItems();
		updateSkinItems();
		createEditorColors();
		updateEditorColors(chanceAllowCustom);
		updateSkinColors();
		afterChange();
	}	
	
	$scope.flipItem = function(outerInd) {
		if (noSkin()) return;
		skinConfig.flip($scope.features[outerInd].key);
		afterChange();
	}
	
	$scope.thumbClick = function(outerInd, innerInd) {
		if (noSkin()) return;
		var slot = $scope.features[outerInd];
		slot.selectedInd = innerInd;
		syncItemsChange();	
	}
	
	$scope.colorSlotClick = function(outerInd, innerInd) {
		var sh = $scope.colorsShop;
		sh.slot = $scope.features[outerInd].colorSlots[innerInd];
		sh.items = sh.slot.availGroups;
		createColorPicker(innerInd);
		setTimeout(function() { 
			if (sh.slot.id.value > 0 && def(picker)) {
				var rgb = intToRGB(sh.slot.id.value)
				picker.fromRGB(rgb.r/255, rgb.g/255, rgb.b/255);
			}
		}, 0);
		sh.visible = true;
	}	
	
	function afterColorShop(value) {
		var slot = $scope.colorsShop.slot;
		if (slot.id.value == value) return false;
		slot.id.value = value;
		//$scope.colorsShop.visible = false;
		syncColorsChange();
		return true;
	}
	
	$scope.colorShopClick = function(outerInd, ind) {
		afterColorShop($scope.colorsShop.items[outerInd].values[ind]);
	}
	
	$scope.colorCustomClick = function() {
		var slot = $scope.colorsShop.slot;
		var v = floatRGBtoInt(picker.rgb[0], picker.rgb[1], picker.rgb[2]);
		v = skinTypes.killColorBits(skinConfig.typeKey, slot.id.key, v);
		afterColorShop(v);
	}	
	
	$scope.shopNoColorClick = function(outerInd, ind) {
		afterColorShop(-1);
	}	
	
	$scope.shopCancel = function() {
		$scope.colorsShop.visible = false;
		clearInterval(pickerInterval);
	}
	
	function findConfig() {
		if (skinModel.ownsCtorSkin) {
			for(var i=0; i<skinModel.ctorConfigs.length; i++) {
				if (skinModel.ctorConfigs[i].type == skinConfig.typeKey)
					return skinModel.ctorConfigs[i];
			}
		}
		return null;
	}
	
	//$scope.checkoutClick = function() {
	//	var ids = [];
	//	for(var i=0; i<$scope.ctor.costItemSlots.length; i++) {
	//		ids.push($scope.ctor.costItemSlots[i].getSelectedItem().id);
	//	}
	//	$scope.priceShop.items = skinThumbs.genThumbs(ids);
	//	skinThumbs.queueThumbs($scope.priceShop.items);
	//	skinThumbs.queryThumbsAsync();
	//	$scope.priceShop.visible = 1;
	//}
	
	$scope.buyClick = function() {        
		var req = {
			code: skinConfig.serialize(),
			cost: $scope.ctor.cost
		}
		
		// validate
		try {
			var appraisal = skinConfig.apprise(itemsOwned, colorsOwned, $scope.ctor.discount);
		}catch(e) {
			alert("Error (apprise)");  // you should not see this normally
			return;
		}
		if (!Costs.equals(appraisal.cost, req.cost)) {
			alert("Error"); // you should not see this unless there is a bug...
			return;
		}
        
        // Unregistered users can't buy new skins,
        // but can activate skins that they already have.
        if (req.cost.plut > 0 && $rootScope.cantBuyAskRegister()) return;
		
		$scope.ctor.blocked = true;
		$http.post('/api/ctor/set_or_buy', req).success(
			function(data) {				
				code = data.result;
				console.log('set_or_buy success ' + code);
				// TODO make some nice reactions here
				switch(code) {
				case CtorBuyResult.SUCCES:
					$scope.ctor.buyBtnVisible = false;
					$scope.user.gold -= req.cost.gold;
					$scope.user.plutonium -= req.cost.plut;
					$scope.user.skin = req.code;
					if (appraisal.items.length + appraisal.colors.length > 0) {
						serverGetOwned(syncSkinChange);
						$rootScope.messageBox("c_skin_purchased", ["ok"], function(){});
					}else {
						var conf = findConfig();
						if (conf != null) {
							conf.skin_code = req.code;
						}else {
							skinModel.ctorConfigs.push( {
								type: skinConfig.typeKey,
								skin_code: req.code
							} );
						}
						$scope.ctor.blocked = false;
					}
					skinModel.dirty = true;
					Game.appInputRejoin();
					break;
				case CtorBuyResult.NOGOLD:
					$rootScope.showNotEnoughMoney('gold', function() { $scope.ctor.blocked = false; });
					break;
				case CtorBuyResult.NOPLUT:
					$rootScope.showNotEnoughMoney('plut', function() { $scope.ctor.blocked = false; });
					break;
				case CtorBuyResult.ERROR:
					$scope.ctor.blocked = false;
					alert(i18nFilter("c_server_error"));
					break;
				}
			}
		).error(		
			function() {
				$scope.ctor.blocked = false;
				console.log('set_or_buy error');
				alert(i18nFilter("c_server_error2"));
			}
		);
	}
	
	$scope.changeSkinType = function(tkey) {
		$scope.selectTabSlot = 0;
		if (tkey == "randomize") {
			skinConfig.setRandomFeatures("same");
			skinConfig.setRandomColors();
			syncSkinChange(0.1);
		}else {
			skinConfig.setType(tkey);
			var conf = findConfig();
			var doInitailRandom = false;
			if (conf != null) {
				try {
					skinConfig.deserialize(conf.skin_code);
					syncSkinChange();
				}catch(e) {
					doInitailRandom = true;
				}
			}else
				doInitailRandom  = true;
			if (doInitailRandom) {
				skinConfig.setRandomFeatures("same", null, true);
				skinConfig.setRandomColors(null, true);				
				skinConfig.makeItemsAffordable(userMoney(), itemsOwned, colorsOwned, calcDiscount());
				syncSkinChange(0);
			}
		}
		/*  GA */	_gaq.push(['_trackEvent', 'Character', 'change_type', 'changeSkinType on done']);	
	}
	
	function onLoadOwned() {
		if (tryUseProposedSkin())
			return;
		var ind = indexByProp(skinModel.ctorConfigs, {skin_code: $scope.user.skin});
		if (ind < 0 && skinModel.ownsCtorSkin) ind  = 0;
		if (ind >= 0) {
			try {
				skinConfig.deserialize(skinModel.ctorConfigs[Math.max(ind, 0)].skin_code);
				syncSkinChange();
			}catch(e) {
				$scope.changeSkinType("?");
			}
		}else
			$scope.changeSkinType("?");
	}

	$scope.ctor = {
		isExpert: false,
		blocked: true,
		noColors: false,
		noItems: false,
		buyBtnVisible: true,
		buyBtnStyle: {}
	};
	
	$scope.colorsShop = {
		visible: false,
		slot: null
	};

	var skinTypes, skinConfig, skinBuilder, skinThumbs, isSkinUpdates;
	var itemsOwned, colorsOwned;
	
	createColorPicker();

	skinModel.getSkinBuilder(function(sb, cd) {
		skinBuilder = sb;
		skinTypes = new SkinTypes(cd.json);
		skinThumbs = new SkinThumbs(skinTypes, sb);
		skinConfig = new SkinConfig(cd.json);
		serverGetOwned(onLoadOwned);		
	});
	
	function buildThumbs() {
		var slot = $scope.features[$scope.selectTabSlot];
		skinThumbs.buildThumbs(slot.items);
	}

	$scope.selectTabSlot = 0;
	$scope.selectTab = function(index) {
		$scope.selectTabSlot = index || 0;
		var slot = $scope.features[$scope.selectTabSlot];
		buildThumbs();
		$scope.colorsShop.visible = false;
		return;
	}

	$scope.pickColor = function() {
		if ($scope.colorsShop.slot && jscolor.picker && jscolor.picker.owner) {
			$scope.colorCustomClick();
		}
	}
	
	adjustPreviewSize();
	
	function tryUseProposedSkin() {
		var v = $rootScope.proposedSkin;
		if (v && "!?".indexOf(v[0]) >= 0) {
			$scope.changeSkinType(v[1]);
			$rootScope.proposedSkin = null;
			return true;
		}
		return false;
	}
	
	var off_proposedSkin = $rootScope.$watch("proposedSkin", function() {
		Utils.whenExist(function(){return itemsOwned}, function() {
			Utils.inNextPhase($scope, tryUseProposedSkin);
		});
	});
	
	$scope.$on("$destroy", function() {
		off_proposedSkin();
		clearInterval(pickerInterval);
	});
});