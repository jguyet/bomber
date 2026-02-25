bombermine.controller('ShowChangeButtons', function($scope, $rootScope, storage, actions, gamepad, $modalInstance) {
    //$scope.visible = false;

    function selectGp(gamepadId) {
        var profile = gamepad.codeProfiles[gamepadId];
        if (profile && $scope.gp != profile) {
            $scope.gp = profile;
            $scope.$apply(function() {
                $scope.sync();
            });
        }
    }

    function gamepadKeyDown(buttonCode, gamepadId) {
        selectGp(gamepadId);
    };

    function gamepadKeyUp(buttonCode, gamepadId) {
        selectGp(gamepadId);
        var name = $scope.selectBut;
        if (actions.list.indexOf(name)<0) return;
        $scope.gp.bind($scope.selectBut, buttonCode);
        $scope.$apply(function() {
            $scope.sync();
        });
    };
    /*
    $rootScope.showChangeButtons = function() {
        if (!$scope.visible) {
            gamepad.on('keydown', gamepadKeyDown);
            gamepad.on('keyup', gamepadKeyUp);
        }
        $scope.visible = true;
    };
    $scope.modalClose = function() {
        if ($scope.visible) {
            gamepad.removeListener('keydown', gamepadKeyDown);
            gamepad.removeListener('keyup', gamepadKeyUp);
        }
        $scope.visible = false;

    };*/
    $scope.init = function() {
        gamepad.on('keydown', gamepadKeyDown);
        gamepad.on('keyup', gamepadKeyUp);
    };
    $scope.init();
    $scope.modalClose = function () {
        gamepad.removeListener('keydown', gamepadKeyDown);
        gamepad.removeListener('keyup', gamepadKeyUp);
        $modalInstance.close();
    };
    $scope.sync = function() {
        for (var i=0;i<$scope.listButtons.length;i++) {
            var b = $scope.listButtons[i];
            b.value = actions.getKeyName(actions.inputs.kb.keyMap[b.name]);
            b.old_value = actions.getButtonName(actions.inputs.gp.keyMap[b.name]);
        }
    };

    $scope.init = function() {
        $scope.listButtons = actions.list.map(function(x) {return {name: x}});
        $scope.gp = actions.inputs.gp;
        $scope.sync();
	    $scope.selectBut = '';
    };
    $scope.init();
    $scope.select = function(e, name) {
		var name = name || "";
    	$scope.selectBut = name;
        $(e.target).find('input').focus();
    };
    $scope.down = function(e) {
        var code = e.keyCode ? e.keyCode : e.which;
        if (code==9) e.preventDefault();
    };
    $scope.change = function(e) {
        var code = e.keyCode ? e.keyCode : e.which;
        var name = $scope.selectBut;
        if (actions.defs.kb0.actionMap[code]) return;
        if (actions.list.indexOf(name)<0) return;
        actions.inputs.kb.bind($scope.selectBut, code);
        $scope.sync();
    };
    $scope.save = function() {
        actions.saveSettings();
    	$scope.modalClose();
    };
    $scope.cancel = function() {
        actions.loadSettings();
    	$scope.modalClose();
    };
    $scope.backKB = function() {
        actions.inputs.kb.loadKeyMap(actions.defs.kb1.keyMap);
        $scope.sync();
    };
    $scope.backGP = function() {
        actions.inputs.gp.loadKeyMap(actions.defs.gp.keyMap);
        $scope.sync();
    };
});