/**
 * Created by Liza on 26.05.2015.
 */
bombermine.directive('buyPackage', function($rootScope, Social, Payment) {
    return {
        restrict: 'AE',
        templateUrl: '/tmpl/money/buyPackage.tmpl',
        scope: {
            calc: "="
        },
        link: function(scope, elem, attrs) {
            var calc;

            function init() {
                scope.symbol = Payment.symbol;
                scope.prices = Payment.prices;
                if (!calc.currency) {
                    calc.currency = ["USD"];
                }
            }

            scope.$watch("calc", function(newValue, oldValue) {
                calc = newValue;
                init(scope);
            })
        }
    }
})