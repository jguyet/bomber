bombermine.controller('ReferralsListCtrl', function($scope, $location, $http, i18nFilter, UserService) {
    $http.get("/api/v3/referrals/list").success(function(data) {
        $scope.referrals = data.referrals
        $scope.referrals_gain = data.referrals_gain
    })
});