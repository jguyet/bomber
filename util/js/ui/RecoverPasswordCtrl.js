bombermine.controller('RecoverPasswordCtrl', function($scope, $location, $http, i18nFilter, UserService) {
    if (UserService.isLoggedIn()) return $location.path('/profile/')
    $scope.is_hash_checked = false;
    $http.post("/api/v3/user/password/is_hash_correct", { hash: $location.search().hash })
        .success(function() { $scope.is_hash_checked = true; })
        .error(function(data, status) {
            switch (status) {
                case 400:
                    $location.path("/").search({})
                    break;
                default:
                    $scope.error = i18nFilter("unknown_error")
                    break;
            }
        })

    $scope.keypress = function(key) {
        if (key.which == 13) {
            $scope.change_password()
        }
    }

    $scope.change_password = function() {
        $scope.processing = true;
        $http.post("/api/v3/user/password/update", { hash: $location.search().hash, new_password: $scope.new_password})
        .success(function() {
            $location.path("/").search({})
        })
        .error(function(data) {
            $scope.error = i18nFilter(data.error)
            $scope.processing = false;
        })
    }
});