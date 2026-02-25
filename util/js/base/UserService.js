bombermine.service("UserService", function($http, $location, $rootScope, Realtime) {
    // Use this method to update user data;
    // Don't change $rootScope.user directly
    function setUserData(user) {
        $rootScope.user = user;
        /* 
            This is single a condition if a user is fully registered (unrestricted)
            in one place (here). It may change.
            Don't check is_guest or other parts of this condition in other places!
        */
        user.isRegistered = function() {
            /*
                It'll return true for:
                - new users only if they're fully-registered
                - old users if they are half-registered (email is not confirmed)
                
                It'll return false for:
                - old guests who was given (perm_mask & 1) on rank 3
            */
            return !this.is_guest && (this.perm_mask & 1);
        }
        // Used to determine if a user can buy something
        user.canBuy = function() {
            // Like with the old account policy, partially and fully-registered 
            // users can buy.
            return !this.is_guest;
        }
        // used to transfer some error or other info
        // in particular, message success or failure of sending confirmation
        // after registration
        if (user.result_code) {
            $rootScope.messageBox(user.result_code, ["ok"], function() {});
            user.result_code = null;
        }
    }
    
    function updateCurrentUser() {
        $http.get("/api/v3/user/current-user").success(function(data, status, headers) {
            setUserData(data);
            $rootScope.config.token = data.token; // look like it's not used
        })
    }

    function setFullData(data) {
        var oldId = $rootScope.user?$rootScope.user.id : 0;
        var newId = data.user.id;
        setUserData(data.user);
        window.config.token = data.user.token; // look like it's not used
        $rootScope.notifications = data.notifications;
        $rootScope.progress = data.progress;
        if (oldId == 0 && newId != 0) {
            $rootScope.$broadcast("login")
        } else if (oldId !=0 && newId ==0) {
            $rootScope.$broadcast("logout")
        } else if (oldId!=0 && oldId!=newId) {
            $rootScope.$broadcast("switch")
        }
    }

    Realtime.events.on("currentUser", function(msg) {
        var data = msg.data;
        if (data) $rootScope.$apply(function() {
            data.user.token = data.user.token || $rootScope.user.token;
            setFullData(data);
        });
    });

    return {
        updateCurrentUser: updateCurrentUser,
        isLoggedIn: function() {
            return $rootScope.user.id != 0
        },
        setFullData: setFullData,
        setUserData: setUserData
    }
});
