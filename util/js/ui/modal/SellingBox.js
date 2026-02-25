bombermine.controller('SellingBox', function ($scope, $rootScope, ShopService, i18nFilter, $modalInstance, params) {
  //$scope.visible = false;
  $scope.disableButton = false;
  
  $scope.item = params.item;
  $scope.curr = params.curr;
  $scope.hud = params.hud;
  $scope.cb = params.cb;

  /*$scope.showBuyItemModal = function (item, curr, hud, cb) {
    $scope.disableButton = false;
    $scope.notification = null;
    if (hud instanceof Function)
      $scope.cb = hud;
    else {
      $scope.cb = cb;
      $scope.hud = hud;
    }
    $scope.itemType = item.type;
    $scope.curr = curr;

    console.log('item', item);

    switch ($scope.itemType) {
      case ('chests'):
      case ('timeperks'):
      case ('slots'):
        $scope.type = 'perk';
        break;
      case ('skin_pack'):
        $scope.type = 'skinpack';
        break;
      default:
        $scope.type = 'skin';
    }
    $scope.item = item;

    $scope.visible = true;
  };*/
  $scope.init = function (item, curr, hud, cb) {
    // don't show confirmation, just show an error message
    if (params.error) {
      $scope.disableButton = true;
      $scope.showError(params.error);
      return;
    }
    
    $scope.disableButton = false;
    $scope.notification = null;
    if (hud instanceof Function)
      $scope.cb = hud;
    else {
      $scope.cb = cb;
      $scope.hud = hud;
    }
    $scope.itemType = item.type;
    $scope.curr = curr;

    console.log('item', item);

    switch ($scope.itemType) {
      case ('chests'):
      case ('timeperks'):
      case ('slots'):
        $scope.type = 'perk';
        break;
      case ('skin_pack'):
        $scope.type = 'skinpack';
        break;
      default:
        $scope.type = 'skin';
    }
    $scope.item = item;
  }

  $scope.close = function () {
    //$scope.visible = false;
    $modalInstance.close();
  };
  
  $scope.showError = function (err) {
    $scope.errorModal(err);
    $scope.errMod = true;
  };

  $scope.buyIt = function (currency) {
    $scope.disableButton = true;

    ShopService.buyItemSrv($scope.item, currency, $scope.hud, function(err, data){
      $scope.errMod = false;
      if (err){
        $scope.showError(err);
      }else{
        $scope.setNotification(data.notification);
        $scope.cb && $scope.cb(data);
      }
    });

  };

  $scope.setNotification = function(value) {
    $scope.notification = value;
  };

  $scope.errorModal = function(err) {
    var title = i18nFilter("error");
    if ((err == "not_enough_gold") || (err == "not_enough_plutonium")) {
      title = "no_money";
    }    
    $scope.setNotification({
      title: title,
      text: i18nFilter(err),
      type: "error"
    });

  };

  $rootScope.showBuyItemModal = $scope.showBuyItemModal;

  $scope.transformNotificationPerk = function(arr) {
    var arrName = [];
    if (!arr) return arrName;
    for (var i = 0; i < arr.length; i++) {
      var index = find(arrName, arr[i]['name']);
      if (index == -1) {
        arrName.push({'name' : arr[i]['name'], 'number': 1})
      }
      else {
        arrName[index]['number'] += 1;
      }
    };
    return arrName;
  };

  function find(array, value) {

    for(var i = 0; i < array.length; i++) {
      if (array[i]['name'] == value) return i;
    }
     
    return -1;
  };
  
  $scope.init($scope.item, $scope.curr, $scope.hud, $scope.cb);

});
