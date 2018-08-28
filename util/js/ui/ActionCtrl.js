bombermine.controller('ActionCtrl', function($rootScope, $scope) {
});
bombermine.directive('action', function () {
    return {
        restrict: 'AE',
        transclude: true,
        scope: {
        	imgUrl: "@imgUrl",
        	name: "@name"
        },
        templateUrl: 'tmpl/actions/mainAction.tmpl'
    }
});