bombermine.controller('LearnCtrl', function($http, $scope, $rootScope, i18nFilter, UserService) {
    $scope.levels2learn = [];
    for (var i = 0; i < 12; ++i){
	    $scope.levels2learn[i] = {
		  n_level: i + 1,
		  header:"header_"+(i+1),
		  descr: "desc_"+(i+1)
		};
	}
	//$scope.cur_level = 3;
	//$scope.max_level = 7;   //max available
	$scope.notAvailableFlag = false;
	$scope.levelUpFlag = false;
	$scope.disableLevelUpFlag = true;
	$scope.isLoggedIn = UserService.isLoggedIn();
	
	$rootScope.showTutorial = function (n1, n2){
		$rootScope.cur_level = n1;
		$rootScope.max_level = n2;
		
		$rootScope.lrnModalActive = true;
	 
	}
	
	$scope.switch_level = function(i_level){
		    if (i_level > $scope.max_level) {
			    $scope.notAvailableFlag = true;
				$scope.disableLevelUpFlag = true;
			} else {
			    $scope.cur_level = i_level;
				// draw i_level canvas
			}
		};
		
	$scope.level_up = function(){
		$scope.max_level++;
		console.log(UserService.isLoggedIn());
		$scope.last_level = ($scope.levels2learn.length == $scope.max_level);
		$scope.disableLevelUpFlag = true;
		$scope.levelUpFlag = true;
	};
	
    $scope.closeNotification = function(){
		if ($scope.levelUpFlag) {
		    $scope.switch_level($scope.max_level);
		}
    	$scope.levelUpFlag = false;
	    $scope.disableLevelUpFlag = true;
   		$scope.notAvailableFlag = false;
		if ($scope.last_level) {
		    $scope.disableLevelUpFlag = true;
		}
	};
	
	 //$scope.lrnModalActive = true;
	 
	 //$rootScope.showTutorial(3,8);
	 
	 
});

