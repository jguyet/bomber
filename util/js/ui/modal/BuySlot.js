bombermine.controller('BuySlot', function($scope, $rootScope, ShopService, $modalInstance, params) {
//  $scope.shopmodel = ShopService.getModel();


  //$scope.visible = false;
  $scope.slots = params.slots || [];

  /*$rootScope.showBuySlot = function(slots) {
    $scope.shopmodel = ShopService.getModel();

    console.log('BuySlot', $rootScope.user.slots_limit);
    $scope.slots = slots;
    //$scope.visible = true;
  };*/
  $scope.shopmodel = ShopService.getModel();
  $scope.modalClose = function() {
    //$scope.visible = false;
    $modalInstance.close();
  };

  $scope.getSlotStatus = function(slot)  {
    if (!slot.open) return 0;
    if (!slot.perk) return 1;
    return 2;
  }

});