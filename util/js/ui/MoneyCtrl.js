bombermine.controller('MoneyCtrl', function($rootScope, $http, $sce, $scope, $location, UserService, Social, Payment) {
    if (!UserService.isLoggedIn()) return $location.path("/")

    var prices = $scope.prices = Payment.prices;
    var calc = $scope.calc = {};
    //this one is not used
    $scope.symbol = Payment.symbol;
    //TODO: зависит от страны
    //TODO: для VK тут должны быть голоса

    if (config.auth=="vk" || config.auth=="kong" || config.auth == "ok")
        calc.currencies = [config.auth];
    else
        calc.currencies = ["USD"];

    var errorFunction = function (data, status) {
        if (status >= 500) {
            // FATAL ERROR
            $rootScope.messageBox("server_error", ["ok"], function (result) {
            });
        } else {
            $rootScope.messageBox(data, ["ok"], function (result) {
            });
        }
    };

    function skuIndex() {
        for (var i=1;i<prices.plut.length;i++) {
            if (calc.plut<prices.plut[i])
                return i-1;
        }
        return prices.plut.length-1;
    }

    $scope.buy = function() {
        Payment.showPayment(calc);
    };
    if (config.auth!="kong" && config.auth!="facebook") {
        //TODO: TEMPORARY MEASURE, REMOVE ASAP
        //TODO: move into Realtime
        var moneyChecker = window.setInterval(UserService.updateCurrentUser, 10000)
        $scope.$on("$destroy", function () {
            window.clearInterval(moneyChecker)
        })
    }
});