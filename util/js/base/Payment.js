bombermine.service("Payment", function($http, $location, $rootScope, Social) {

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

    var prices = $rootScope.config.plutoPrices;

    var Payment = {
        prices: prices,
        plutMin : prices.plut[0],
        plutMax : prices.plut[prices.plut.length-1],
        symbol: {"EUR": "€", "USD": "$", "RUB": String.fromCharCode(0x20BD), "ok": "ОК", "JPY": "¥", "vk": "голосов", "kong": "K"},
        toPluto: function(money, currency) {
            var x1, x2, y1, y2;
            var res;
            var price = prices[currency]
            if (money < price[0]) {
                return 'min';
            } else if (money > price[price.length-1]) {
                return 'max';
            } else if (money == '') {
                return false;
            }
            for (var i = 1; i < price.length; i++) {
                if (money <= price[i]) {
                    x1 = price[i-1];
                    x2 = price[i];
                    y1 = prices.plut[i-1];
                    y2 = prices.plut[i];
                    res = (money - x1)*(y2 - y1)/(x2 - x1) + y1;
                    return Math.floor(res);
                }
            }
            return false;
        },
        toMoney: function(plut, currency) {
            var x1, x2, y1, y2;
            var res;
            var price = prices[currency]
            //console.log(plut)
            /*if (plut == '') {
             return 0;
             }
             if (typeof(plut) != 'number') {
             return 'err';
             } else*/ if (plut < Payment.plutMin) {
                return 'min';
                //return prices[0][currency];
            } else if (plut > Payment.plutMax) {
                return 'max';
                //return prices[prices.length-1][currency];
            } else if (plut == '') {
                return false;
            }
            for (var i = 1; i < price.length; i++) {
                if (plut <= prices.plut[i]) {
                    x1 = prices.plut[i-1];
                    x2 = prices.plut[i];
                    y1 = price[i-1];
                    y2 = price[i];
                    res = (plut - x1)*(y2 - y1)/(x2 - x1) + y1;
                    if (currency == "vk")
                        return Math.ceil(res);
                    return Math.ceil(res*100)/100;
                }
            }
            return false;
        },
        showPayment: function(calc, goalId) {
            if (config.auth == "vk" && (typeof goalId === "undefined")) {
                //VK
                VK.callMethod('showOrderBox', { type: 'item', item: 'plut_'+calc.plut });
            } else if (config.auth=="kong"&& (typeof goalId === "undefined")) {
                if ($rootScope.user.is_guest)
                    Social.showRegister()
                else
                    Social.kong.mtx.purchaseItemsRemote("plut_"+calc.plut, function(event) {
                        if (event.success) {
                            UserService.updateCurrentUser()
                        }
                    })
            } else if (config.auth == "facebook") {
                $http.post('/api/v3/facebook/invoice', {amount: +calc.money, currency: calc.currency, plutonium: +calc.plut, goalId: goalId}).success(function (data) {
                    FB.ui({
                        method: 'pay',
                        action: 'purchaseitem',
                        product: data.product,
                        quantity: data.plutonium,                 // optional, defaults to 1
                        request_id: data.invoiceId + '' // optional, must be unique for each payment
                    }, function(answer) {
                        console.log("facebook answer", answer);
                        if (answer.error_code) return;
                        $http.post('/api/v3/facebook/fulfill', { signed_request: answer.signed_request }).success(function(data){
                            UserService.updateCurrentUser();
                        }).error(errorFunction)
                    });
                }).error(errorFunction)
            } else if (config.auth == "spil") {
                //find plut type
                $http.post('/api/v3/spil/invoice', {amount: +calc.money, currency: calc.currency, plutonium: +calc.plut, goalId: goalId}).success(function (data) {
                    Social.spil.User.getUser(function(userData) {
                        var client = new PaymentClient();
                        var options = {
                            'siteId': config.siteId,
                            'gameId': 258,
                            'userId': userData.displayName,
                            'token': data.invoiceId + '',
                            'selectedSku': 'plutonium',
                            'dynamic_pricing': 1,
                            'params': 'pluto='+calc.plut
                        };
                        client.showPaymentSelectionScreen(options);
                    })
                }).error(errorFunction)
            } else if (config.auth == "ok") {
                var plut = +calc.plut;
                var money = +Payment.toMoney(plut, "ok");
                $http.post('/api/v3/ok/invoice', {amount: money, currency: "ok", plutonium: +calc.plut, goalId: goalId}).success(function (data) {
                    var options = {
                        name: plut+" плутония",
                        description: "Плутоний позволяет покупать скины, улучшения и поддерживать команду своими взносами",
                        code: data.invoiceId + '',
                        price: money
                    };
                    Social.fapi.UI.showPayment(options.name, options.description, options.code, options.price);
                }).error(errorFunction)
            } else
            {
                //XSOLLA
                $http.post('/api/v3/xsollaCheckout', {amount: +calc.money, currency: calc.currency, plutonium: +calc.plut, goalId: goalId}).success(function (data) {
                    XPSLightBox.open(data.url, 900, 650);
                    //$rootScope.iframeLightBox(data.url, 900, 650)
                }).error(errorFunction)
            }
        }
    }
    return Payment;
});
