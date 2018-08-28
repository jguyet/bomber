bombermine.controller('SkinsCtrl', function($scope, $rootScope, i18nFilter, $http, Game, $state, skinModel, storage) {
    $scope.skinModel = skinModel;
    $scope.selectedSkin = skinModel.activeSkin;
    var collapsed = {};
    try {
        collapsed = JSON.parse(storage.getItem("collapsedSkinGroups", "{}"));
    }catch(e) { }

    $scope.$watch(skinModel.getActiveSkin, function(newVal, oldVal) {
    	if (!$rootScope.proposedSkin)
        	$scope.selectSkin(newVal);
    });

    var off_proposedSkin = $rootScope.$watch("proposedSkin", function(newVal, oldVal) {
        if (newVal && "!?".indexOf(newVal[0]) < 0) {
            var skin = skinModel.byName[newVal];
            if (skin.shopGroup)
                $scope.setCollapsed(skin.shopGroup, false);
            Utils.inNextPhase($scope, function() {
                $scope.selectSkin(skin);
                $rootScope.proposedSkin = null;
                Utils.whenExist([
                    "skin_outer_" + newVal, "skins_scroll", "skins_scroll_base"
                ], function(skinEl, containerEl, baseEl) {
                    Utils.whenExist([
                        function() { return Utils.getElementRelativePos(skinEl, containerEl) },
                        function() { return Utils.getElementRelativePos(baseEl, containerEl) }
                    ], function(skinPos, basePos) {
                        Utils.scroll($scope, containerEl, Math.max(0, skinPos.y - basePos.y - 50));
                    });
                });
            });
        }
    });

    $scope.editSelectedSkin = function() {
		skinModel.activateSkin($scope.selectedSkin, function() {
            $state.go("skins.character");
        });
    }

    $scope.selectSkin = function(skin) {
        $scope.selectedSkin = skin;
        console.log("Selected skin name: " + skin.name);
    }

    $scope.buySkinModal = function(item) {
        if ($rootScope.cantBuyAskRegister())
            return;
        //setAnimatedPreview("modalSkinCanvas");
        $rootScope.showBuyItemModal(item, 'plut', 'skins', function(data){
            console.log('skin is bought', data, $scope.skinModel);
            var duration = item.duration;
            var pack = !!item.skins;
            item = item.skin;
            item.active = true;
            skinModel.reload(function() {
                $scope.activateSkin(item);
            });
        });
    }

    $scope.activateSkin = function(item) {
        if ($rootScope.user.is_guest && $rootScope.cantBuyAskRegister())
            return;
        skinModel.activateSkin(item);
    }
    $scope.getSkinStyle = skinModel.getSkinStyle;
    $scope.getShadowStyle = skinModel.getShadowStyle;
    
    $scope.saveOrRemoveSelectedSkin = function() {
        var doChange = $scope.selectedSkin.saved;
        skinModel.saveOrRemoveSkin($scope.selectedSkin, function() {
            if (doChange)
                Utils.apply($scope, function() {
                    $scope.selectedSkin = skinModel.activeSkin;
                });
        });
    }
    
    $scope.saveOrRemoveDisabled = function() {
        return $scope.selectedSkin.saved == -1 ||
            ($scope.selectedSkin.saved
            && skinModel.numberOfSameTypeSkins($scope.selectedSkin) == 1);
    }

	$scope.ifNotExpired = function(msg, seconds) {
		return seconds - Date.now() / 1000 > 0
			? i18nFilter(msg)
			: "";
    }
    
    $scope.getCollapsed = function(group) {
        return !group.alwaysVisible && collapsed[group.name];
    }
    
    $scope.setCollapsed = function(group, v) {
        if (v)
            collapsed[group.name] = 1;
        else
            delete collapsed[group.name];
        // remove former group names
        var list = skinModel.groups.list;
        for(var key in collapsed) {
            var alive = false;
            for(var j=0; j<list.length; j++)
                alive = alive || list[j].name == key;
            if (!alive)
                delete collapsed[key];
        }
        storage.setItem("collapsedSkinGroups", JSON.stringify(collapsed));
    }
    
    $scope.flipCollapsed = function(group) {
        $scope.setCollapsed(group, !collapsed[group.name]);
    }
    
    $scope.$on("$destroy", off_proposedSkin);
});
