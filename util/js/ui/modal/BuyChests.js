bombermine.controller('BuyChests', function($scope, $rootScope) {
    $scope.visible = false;
    
    $rootScope.showBuyChests = function() {
        $scope.visible = true;
    }
    $scope.modalClose = function() {
        $scope.visible = false;
    }
});