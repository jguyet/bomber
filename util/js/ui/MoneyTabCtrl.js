bombermine.controller('MoneyTabCtrl', function($rootScope, $http, $sce, $scope, $location, UserService, Social, $state) {

	$scope.ulTab = [
		{ name: "buy_now", route: "money.buy_now"},
		{ name: "projects", route: "money.goal"}
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
	});
});