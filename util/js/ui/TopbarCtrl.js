bombermine.controller('TopbarCtrl', function($scope, $rootScope, $location, i18nFilter, $http, UserService, localize) {
    $scope.is_current_user_exists = function() {
       return UserService.isLoggedIn()
    }

    $scope.$on('localized', function(event) {
        $scope.currentLocale = localize.locale;
    });

});
