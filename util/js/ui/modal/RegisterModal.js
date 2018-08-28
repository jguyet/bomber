bombermine.controller('RegisterModal', function($scope, $rootScope, Social, $modalInstance) {
    /*$scope.visible = false;
    
    $rootScope.showRegister = function() {
        if (Social.active) {
            Social.showRegister();
            return;
        }
        $scope.visible = true;
    }*/
    
    $scope.modalClose = function() {
        $modalInstance.close();
        //$scope.visible = false;
    }

    $scope.$on("register", $scope.modalClose);
});