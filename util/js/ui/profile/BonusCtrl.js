bombermine.controller('BonusCtrl', function ($http, $scope, $rootScope, i18nFilter, UserService) {
    var byName = {}
    function updateBonuses() {
        $scope.achievements = []
        var a = $scope.achievements;
        (function () {
            var b = $rootScope.config.achievements;
            for (var i = 0; i < b.length; i++) {
                a.push({
                    name: b[i].name,
                    list: b[i].list
                })
            }
        })();
        byName = {};
        for (var i = 0; i < a.length; i++) {
            byName[a[i].name] = a[i]
            a[i].level = a[i].next_grade = a[i].progress = 0;
            a[i].max = false;
            if (a[i].name == "days") {
                a[i].minutes = a[i].list[0].limit / 60;
            }
        }
        $http.get('/api/v3/bonuses/progress').success(function (data) {
            $rootScope.progress = data;
            for (var i = 0; i < data.bonuses.length; i++) {
                var record = data.bonuses[i];
                var b = byName[record.bonus_type];
                if (!b) continue;
                b.level = record.bonus_level
                b.progress = record.progress
                b.max = b.level == b.list.length
                b.next_grade = !b.max ? b.list[b.level].limit - b.progress : 0;
                if (record.bonus_type == "days") {
                    b.max = false;
                    if (record.date == data.today) {
                        b.max = true;
                        b.minutes = 0;
                    }
                    else if (record.date == data.yesterday) {
                        b.minutes = b.progress / 60 | 0;
                        if (b.level == b.list.length)
                            b.level = 0;
                    }
                    else {
                        b.level = 0;
                        b.minutes = 0;
                    }
                    if (!b.max)
                        b.minutes = b.list[b.level].limit / 60 - b.minutes;
                }
            }
        })
    }

    updateBonuses()

    $scope.achievementClick = function (name, level) {
        if (($rootScope.user.perm_mask & 4) == 0) return;
        $rootScope.messageBox("Set bonus '"+name+"' to level "+level+"?", ["ok", { text: "reset", style: "" }, "cancel"], function (result) {
            if (result == 2) return;
            var lvl = (result == 1) ? 0 : +level;
            $http.post('/api/v3/bonuses/set-bonus-level', {name: name, level: lvl}).success(function (data) {
                byName[name].level = lvl;
                byName[name].progress = lvl==0?0:byName[name].list[lvl-1].limit;
            }).error(function(err) {
                //nothing
            })
        });
    }
});