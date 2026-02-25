bombermine.controller('SquadsCtrl', function($scope, Game) {
    console.log('SquadsCtrl init');

    $scope.squads = function () {
        return Game.squads;
    }

    $scope.squads().$el = $('#scoreboard-new .tab-page-squads ul.squads');

    $scope.squads().onUpdate = function () {
        $scope.maxSquadSize = Game.squads.maxSquadSize
        $scope.$apply();
    }

    $scope.mySquadId = function () {
        return $scope.squads().mySquadId;
    }

    $scope.createSquad = function () {
        Game.gameSquadCreate();
    }

    $scope.joinSquad = function(squad) {
        Game.gameSquadJoin(squad.id);
    }

    $scope.leaveSquad = function(squad) {
        Game.gameSquadLeave(squad.id);
    }

    $scope.kickPlayer = function(squad, player) {
        Game.gameSquadKick(player.id);
    }

    $scope.togglePrivate = function(squad) {
        if (squad.ownerId != $scope.myPlayerId())
            return;
        Game.gameSquadPrivate(!squad.private);
    }

    $scope.myPlayerId = function () {
        return Game.players.myId;
    }

    $scope.$on("$destroy", function(e) {
        $scope.squads().onUpdate = function () {};
        console.log('SquadsCtrl destroy');
    });
});

bombermine.filter('squadsFilter', function () {
    return function (squads, q) {
        if (!q || q.length < 2)
            return squads;

        q = q.toLowerCase();

        return squads.filter(function(squad) {
            if (~(squad.name + '[' + squad.id + ']').toLowerCase().indexOf(q) || squad.getAll().filter(function(player) {
                return ~player.nickname.toLowerCase().indexOf(q) ? player : false;
            }).length)
                return squad;

            return false;
        });
    };
});

bombermine.directive('uiInput', function($parse, Keys) {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, model) {
            element.on('focus', function() {
                Keys.lock("squad_search");
            }).on('blur', function() {
                Keys.unlock("squad_search");
            }).on('keydown', function(e) {
                if(e.which == 27) {
                    scope.$apply(model.$setViewValue(null));
                    element.val('');
                    element.blur();
                }
            });
        }
    };
});
