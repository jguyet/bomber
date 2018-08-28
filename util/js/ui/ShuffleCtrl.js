bombermine.controller('ShuffleCtrl', function($scope, $rootScope) {
	var back = new BackgroundApp('bg', 'html5');
    $scope.$on('$destroy', function () {
		back.free();
    });
})