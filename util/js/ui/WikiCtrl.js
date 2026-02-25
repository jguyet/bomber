bombermine.controller('WikiCtrl', function($scope, $rootScope, $sce, $location, $http, i18nFilter, UserService, $state) {

  var lc = $rootScope.currentLocale;
  $scope.ulTab = [
    { name: "menu_faq", route:"wiki."+lc+"faq"},
    { name: "menu_htp", route:"wiki."+lc+"howToPlay"},
    { name: "menu_ts", route:"wiki."+lc+"troubleshooting"},
    /*{ name: "menu_services", route:"wiki."+lc+"services"},*/
    { name: "menu_credits", route:"wiki."+lc+"credits"}
    /*{ name: "menu_referrals", route:"wiki."+lc+"referrals"}*/
  ];

  $scope.go = function(route){
    $state.go(route);
  };

  $scope.active = function(route){
    return $state.is(route);
  };

  $scope.$on("$stateChangeSuccess", function () {
    $scope.ulTab.forEach(function(tab) {
      tab.active = $scope.active(tab.route);
    });
    $scope.$broadcast('rebuild:scroll');
  });

  $scope.$broadcast('rebuild:scroll');



});

