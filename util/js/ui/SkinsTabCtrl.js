bombermine.controller('SkinsTabCtrl', function($scope, $rootScope, $sce,
    $location, $http, i18nFilter, UserService, $state, skinModel)
{
  $scope.ulTab = [
    { name: "skins",            route:"skins.skins"},
    { name: "skin_constructor", route:"skins.character"},
  ];

  $scope.go = function(route){
    if (route == "skins.skins" && skinModel.dirty) {
        skinModel.reload(function() {
            $state.go(route);
        });
    }else
        $state.go(route);
  };

  $scope.active = function(route){
    return $state.is(route);
  };

  $scope.$on("$stateChangeSuccess", function () {
    $scope.ulTab.forEach(function(tab) {
      tab.active = $scope.active(tab.route);
    });
  });
});