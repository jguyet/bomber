bombermine.controller('TabRegCtrl', function($scope, $rootScope, $location, $http, UserService, i18nFilter, Keys, Game) {
    $("input.ctrl").bind('focus', function(){
    Keys.lock("score_reg");
    });

    $("input.ctrl").bind('blur', function(){
    Keys.unlock("score_reg");
    });

    $scope.user_info = {}

    $scope.getUserAward = function() {
        var info = $scope.user_info, a = $rootScope.user;
        info.gold = a.gold
        info.plutonium = a.plutonium
        info.kills = a.kills
        info.team_capture = a.team_capture
        info.score = a.score
        a = Game.getPlayerInfo();
        if (a) {
            info.gold += a.money
            info.plutonium += a.plutonium || 0
            info.kills += a.kills
            info.team_capture += a.team_capture || 0
            info.score += a.score
        }
    }

    $scope.getUserAward()
    $scope.$on('tabMenuOpen', $scope.getUserAward);
});