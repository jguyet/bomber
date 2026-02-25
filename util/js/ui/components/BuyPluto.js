/**
 * Created by Liza on 26.05.2015.
 */
bombermine.directive('buyPluto', function($rootScope, Social, Payment) {
    var prices = Payment.prices;
    return {
        restrict: 'AE',
        templateUrl: '/tmpl/money/buyPluto.tmpl',
        scope: {
            calc: "="
        },
        link: function(scope, elem, attrs) {
            var calc;

            function init() {
                scope.plutMin = Payment.plutMin;
                scope.plutMax = Payment.plutMax;
                scope.symbol = Payment.symbol;
                if (!calc.currencies) {
                    calc.currencies = ["USD"];
                }
                calc.currency = calc.currencies[0];
                if (!calc.money) {
                    calc.money = prices[calc.currency][3];
                    calc.plut = prices['plut'][3];
                } else {
                    calc.money = '' + calc.money;
                    scope.checkMoney();
                }
            }

            scope.checkMoney = function() {
                calc.money = checkNumber(calc.money);
                calc.plut = Payment.toPluto(calc.money, calc.currency);
            }

            scope.checkPlut = function() {
                calc.plut = checkNumber(calc.plut);
                calc.money = Payment.toMoney(calc.plut, calc.currency);
            }

            function checkNumber(val) {
                if (typeof val == "number") return val;
                var res = val.replace(/[^\d]+/g, "");
                return res;
            }

            scope.$watch("calc", function(newValue, oldValue) {
                calc = newValue;
                init(scope);
            })
        }
    }
})