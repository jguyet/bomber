/**
 * Created by Liza on 02.06.2015.
 */
bombermine.service("Tracking", function($http, $location, $rootScope) {
    return {
        track: function(key, value) {
            //and in GA too
            _gaq.push(['_trackEvent', "user_track_"+key, "user_track_"+key+"_"+value, ""]);
            $http.post("/api/v3/user/track", [{key: key, value:value}])
        },
        settings: function(key, value) {
            $http.post("/api/v3/user/settings", [{key: key, value:value}])
        }
    }
});