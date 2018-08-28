bombermine.controller('KeyboardCtrl', function ($scope, $rootScope, Game, Keys, gamepad, actions) {
    // gamepad
    var gamepadKeyDown = function (key, gamepadId) {
        if (Keys.isLocked()) return;
        var action = gamepad.codeProfiles[gamepadId].actionMap[key];
        if (action) actions.pressGamepadDown(action);
    };

    var gamepadKeyUp = function (key, gamepadId) {
        if (Keys.isLocked()) return;
        var action = gamepad.codeProfiles[gamepadId].actionMap[key];
        if (action) actions.pressGamepadUp(action);
    };

    // keyboard
    var docOnKeyDown = function (e) {

        if (Keys.isLocked()) return;

        var code = e.keyCode ? e.keyCode : e.which;

//      console.log('key down', code);
        actions.pressKeyboardDown(code);

        if (code >= 49 && code <= 56 || code >= 65 && code <= 90) {
            Game.appInputAbility(code);
        } else if (actions.isKeyboardCode(code)) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    var docOnKeyUp = function (e) {

        if (Keys.isLocked()) return;

        var code = e.keyCode ? e.keyCode : e.which;

//      console.log('key up', code);
        actions.pressKeyboardUp(code);

        if (actions.isKeyboardCode(code)) {
            e.stopPropagation();
            e.preventDefault();
        }

    };

    // registration

    Game.on('appEventOpenChat', Keys.lock);
    Game.on('appEventCloseChat', Keys.unlock);

    $(document).on('keydown', docOnKeyDown);
    $(document).on('keyup', docOnKeyUp);

    gamepad.on('keydown', gamepadKeyDown);
    gamepad.on('keyup', gamepadKeyUp);

    $scope.$on('$destroy', function () {
        $(document).unbind('keydown', docOnKeyDown);
        $(document).unbind('keyup', docOnKeyUp);
        gamepad.removeListener('keydown', gamepadKeyDown);
        gamepad.removeListener('keyup', gamepadKeyUp);
    });
});