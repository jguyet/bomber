bombermine.controller('HUDCtrl', function($rootScope, $scope) {
	console.log('HUDCtrl init');
	
    $scope.$on('$destroy', function () {
        console.log('HUDCtrl destroy');
    });
});
