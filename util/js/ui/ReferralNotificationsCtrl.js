bombermine.controller('ReferralNotificationsCtrl', function($scope, $location, $http, i18nFilter, $timeout, UserService) {
    (function poll_refferals_data() {
        $http.get("/api/v3/referrals/poll").success(function(data, status) {
			if (status == 200)
			    $scope.notifications = data
			else $scope.notifications = [];
        })

        /* Раз в пять минут запрашиваем с сервака есть ли у текущего пользователя бонус за рефералов */
        $timeout(poll_refferals_data, 5 * 60 * 1000)
    })()

    $scope.close_notification = function(id) {
        $scope.notifications.shift();
        $http.post("/api/v3/referrals/close-notification", {id: id})
        $("#notification" + id).hide()
    }
});