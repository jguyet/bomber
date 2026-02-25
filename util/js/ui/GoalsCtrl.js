bombermine.controller('GoalsCtrl', function($rootScope, $http, $sce, $scope, $location, UserService, Social, Payment) {
    $scope.section = "Projects";

    function event(p1, p2) {
        _gaq.push(['_trackEvent', $scope.section, $scope.section.toLowerCase()+'_'+p1, p2]);
    }
    $scope.event_section = function(name) {
        $scope.section=name;
        event('projects_main', 'Click on projects');
    }

    $scope.goals = [];

    $scope.curGoal = null;

    $scope.nextGoal = function() {
        var g = $scope.goals;
        if ($scope.curGoal==null) {
            //feature desktop client!
            if (g.length>=5) $scope.curGoal= g[$scope.firstTimeSeeEvent?4:0];
            else $scope.curGoal = g[Math.random()*g.length|0];
            return;
        }
        for (var i=0;i<g.length;i++) {
            if (g[i]==$scope.curGoal) {
                $scope.curGoal = g[(i+1)%g.length];
                break;
            }
        }
    }

    $scope.selectGoal = function(goal) {
        $scope.curGoal=goal;
        event('project_click', 'Click on project');
    }

    function reload() {
        $http.get('/api/v3/goals/list').success(function (data) {
            $scope.goals = data.all;
            for (var i = 0; i < data.all.length; i++) {
                var goal = data.all[i];
                goal.current = goal.status == 2;
                goal.donated = 0;
                goal.progress = Math.ceil(100 * goal.amount / goal.goal);
                goal.calc = {money: goal.tier1};
                if (goal.imageUrl) {
                    goal.imageUrl = $sce.trustAsResourceUrl(goal.imageUrl);
                }
                goal.topDonators = [];
                for (var j = 0; j < data.my.length; j++) {
                    var donation = data.my[j];
                    if (goal.id == donation.goalId) {
                        goal.donated = Math.round(donation.amount*10)/10;
                    }
                }
            }
            if ($scope.curGoal!=null) {
                var name = $scope.curGoal.name;
                $scope.curGoal = null;
                for (var i=0;i<$scope.goals.length;i++)
                    if ($scope.goals[i].name==name) {
                        $scope.curGoal = $scope.goals[i];
                    }
            }
            if ($scope.curGoal==null) {
                $scope.nextGoal();
            }
        }).error(function (data, status) {
            //nothing
        });
    }
    $scope.$watch(function() {
        return $rootScope.user.plutonium;
    }, reload);


	$scope.toggle = function(elem, flag) {
		elem.tab = flag || 0;
        event('project_toggle_click', 'toggle project tab');
        if (flag == 1) {
            $http.get('/api/v3/goals/top?id='+elem.id).success(function(data) {
                elem.topDonators = data;
                for (var i=0;i<data.length;i++) {
                    data[i].amount = Math.round(data[i].amount*10)/10;
                }
            })
        }
	}
    $scope.topDonators = [];

    $scope.buy = function(goal, scrbrd) {
        event('projects_donate_'+goal.name, 'Click on donate');
        Payment.showPayment(goal.calc, goal.id);
    }

    $scope.getSkinThumbSrc = function(skin) {
        return '/api/ctor/getskin?name='+encodeURIComponent(skin || 'default')+'&thumb=1';
    }

    $scope.pluttyProgressStyle = function(w, flag) {
        if (w > 42 && w < 61 && flag) {
            return {
                "margin-left": "-10rem",
                "left": w+'%'
            }    
        }
        return {};
    }
})