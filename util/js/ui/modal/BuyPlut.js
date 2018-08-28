bombermine.controller('BuyPlut', function($scope, $rootScope) {
    $scope.visible = false;
    
    $rootScope.showBuyPlut = function() {
        $scope.visible = true;
    }
    $scope.modalClose = function() {
        $scope.visible = false;
    }

});