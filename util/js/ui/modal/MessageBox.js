bombermine.controller('MessageBox', function($scope, $rootScope, $modalInstance, params) {
    var default_buttons = {
        "ok": {
            text: "ok",
            style: "buy_border"
        },
        "cancel": {
            text: "cancel",
            style: ""
        }
    }
    $scope.params = params;
    var buttons = params.buttons;
    for (var i=0; i< buttons.length; i++)
        if (typeof buttons[i] == 'string') {
            if (!default_buttons.hasOwnProperty(buttons[i]))
                throw "bad button code"
            var btn0 = default_buttons[buttons[i]];
            var btn = buttons[i] = {};
            for (var key in btn0)
                if (btn0.hasOwnProperty(key))
                    btn[key] = btn0[key];
        }
    for (var i = 0; i<buttons.length; i++)
        buttons[i].result = buttons[i].result || i;
    $scope.clickButton = function(button) {
    	$modalInstance.close(button.result);
    }
});
