bombermine.controller('BonusNotificationsCtrl', function($scope, $rootScope, $location, $http, i18nFilter, $timeout,  localize, UserService) {
    // вынос notification
    var notifications = [];

    /*var get_achievements = function() {
     var a_data;
     $http.get('/conf/achievements.json').success(function(data) {
     return  data;
     });

     return a_data;
     }

     */
    $scope.nextNotification = function() {
        $http.post("/api/v3/bonuses/close-notification", {notificationId:notifications.shift().id})
        $scope.notification = notifications[0]
    }

    $rootScope.show_notifications = function(bonus_list) {
        if (bonus_list.length>0) {
            notifications = bonus_list;
            $scope.notification = notifications[0]
        }
    }

    function load_bonus_list(data_list) {
        var bonus_list = [];
        var data = $rootScope.config.achievements;
        var mapping = {};
        for ( var i=0; i < data.length; i++) {
            mapping[data[i].name] = data[i];
        }
        for (var key in data_list) {
            var record = data_list[key];
            var config = mapping[record.bonus_type].list[record.bonus_level-1];
            record.display_type = config.display_type;
            record.reward_type = config.reward_type;
            record.reward_name = config.reward_name;
            record.reward_amount = config.reward_amount;
            record.limit = config.limit ;
            bonus_list.push (record);
            $rootScope.show_notifications(bonus_list);
        }
    }

    $rootScope.check_for_notifications = function() {

        $http.get("/api/v3/bonuses/list").success(function(data) {
            load_bonus_list(data)
        })
    }
    
    load_bonus_list($rootScope.notifications);
    $rootScope.notifications = null;

    window.testnotify = function() {
        $scope.$apply(function() {
            var bonus_list = [
                {"id":96,"user_id":10,"bonus_type":"days","bonus_level":3,"checked":false,"display_type":"gold","reward_type":"gold","reward_name":"","reward_amount":5000,"limit":1200},
                {"id":96,"user_id":10,"bonus_type":"days","bonus_level":4,"checked":false,"display_type":"pu","reward_type":"plutonium","reward_name":"","reward_amount":1,"limit":1200},
                {"id":96,"user_id":10,"bonus_type":"days","bonus_level":5,"checked":false,"display_type":"chest","reward_type":"time_perk","reward_name":"autoshield","reward_amount":3600,"limit":1200},
                {"id":96,"user_id":10,"bonus_type":"kills","bonus_level":1,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":10},
                {"id":97,"user_id":10,"bonus_type":"kills","bonus_level":2,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":100},
                {"id":98,"user_id":10,"bonus_type":"kills","bonus_level":3,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":500},
                {"id":99,"user_id":10,"bonus_type":"kills","bonus_level":4,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":1000},
                {"id":100,"user_id":10,"bonus_type":"kills","bonus_level":5,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":2000},
                {"id":101,"user_id":10,"bonus_type":"kills","bonus_level":6,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":5000},
                {"id":102,"user_id":10,"bonus_type":"kills_per_round","bonus_level":1,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":10},
                {"id":103,"user_id":10,"bonus_type":"kills_per_round","bonus_level":2,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":25},
                {"id":104,"user_id":10,"bonus_type":"kills_per_round","bonus_level":3,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":50},
                {"id":105,"user_id":10,"bonus_type":"kills_per_round","bonus_level":4,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":75},
                {"id":106,"user_id":10,"bonus_type":"kills_per_round","bonus_level":5,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":100},
                {"id":107,"user_id":10,"bonus_type":"kills_per_round","bonus_level":6,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":125},
                {"id":108,"user_id":10,"bonus_type":"kills_per_round","bonus_level":7,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":150},
                {"id":109,"user_id":10,"bonus_type":"kills_per_round","bonus_level":8,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":175},
                {"id":110,"user_id":10,"bonus_type":"kills_per_round","bonus_level":9,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":200},
                {"id":111,"user_id":10,"bonus_type":"gold","bonus_level":1,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":1000},
                {"id":112,"user_id":10,"bonus_type":"gold","bonus_level":2,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":10000},
                {"id":113,"user_id":10,"bonus_type":"gold","bonus_level":3,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":50000},
                {"id":114,"user_id":10,"bonus_type":"gold","bonus_level":4,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":100000},
                {"id":115,"user_id":10,"bonus_type":"rounds","bonus_level":1,"checked":false,"display_type":"star","reward_type":"star","reward_name":"","reward_amount":0,"limit":1}]
            $rootScope.show_notifications(bonus_list);
        })
    }
    
});