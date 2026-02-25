bombermine.controller('ProfileCtrl', function($scope, $rootScope, $location, $http, i18nFilter, UserService) {
    if (!UserService.isLoggedIn()) return $location.path('/')

    if ($rootScope.profileTab) {
        $scope.activeTab = $rootScope.profileTab;
        $rootScope.profileTab = null;
    } else {
        $scope.activeTab = 'stats';  
    } 

    UserService.updateCurrentUser();	
	//modal

	_gaq.push(['_setCustomVar', 1, 'user_load_profile', $scope.user.id, 1]);
	
    $scope.notification = null;
    $scope.setNotification = function(value) {
        $scope.notification = value;
    }
	$scope.disable_buttons_flag = false;

    $scope.toggleModal = function(cart) {
      $scope.disable_buttons_flag = false;
          if (!cart) {
              $scope.notification = null;
              $rootScope.modalActive = false;
          } else {
              $scope.cart = cart;
        $rootScope.modalActive = true;
      }
    }

    $scope.errorModal = function(err) {
        $scope.setNotification({
            title: i18nFilter("error"),
            text: i18nFilter(err),
            type: "error"
        });
    }
    
    $scope.referralsEnabled = function() {
        return !($scope.user.flags & 1);
    }

    var _userId = $scope.user.id;

    $scope.$on('$destroy', function () {
        $rootScope.modalActive = false
        console.log('ProfileCtrl destroy');
		
		_gaq.push(['_setCustomVar', 1, 'user_close_profile', _userId, 1]);
    });

});

