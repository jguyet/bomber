bombermine.controller('LoginInGame', function($scope, $rootScope, $modalInstance) {
    /*$scope.visible = false;
    
    $rootScope.askLogoutInGame = function() {
        $scope.visible = true;
    }*/
    $scope.modalClose = function() {
        //$scope.visible = false;
        $modalInstance.close();
    }
    $scope.logout = function() {
        $scope.modalClose();
        location.href = "/logout?auth="+(config.auth||"b");
    }

});