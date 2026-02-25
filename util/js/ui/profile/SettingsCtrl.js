bombermine.controller('SettingsCtrl', function($scope, $rootScope, $location, $http, i18nFilter, UserService, $timeout, storage, Sounds) {
    UserService.updateCurrentUser();
    
    // used to prevent click-span
    $scope.disableConfirmButton = false;
    
    $scope.emailConfirmed = function() {
        return $rootScope.user.flags & 2;
    }

    $scope.sendConfirmation = function() {
        if ($scope.disableConfirmButton) return;
        $scope.disableConfirmButton = true;
        $http.post("/api/v3/user/email/send-confirm", {}).success(function(data) {
            $scope.disableConfirmButton = false;
            $rootScope.messageBox("email_confirmation_sent",["ok"], function(result) {});
        }).error(function(errors, status) {
            $scope.disableConfirmButton = false;
            if (status==0)
                $rootScope.messageBox("server_no_connection",["ok"], function(result) {});
            else if (status>=500)
                $rootScope.messageBox("server_error",["ok"], function(result) {});
            else
                $rootScope.messageBox(errors,["ok"], function(result) {});
        })
    }

    $scope.toggleChatRight = function() {
        $rootScope.chatRight = !$rootScope.chatRight;
        storage.setItem('chatRight', $rootScope.chatRight);
    }

    $scope.sounds = Sounds;
    $scope.isMuted = Sounds.isMuted();
    $scope.getVolume = Sounds.getVolume()*100;
    $scope.playRandom = Sounds.playRandom;
    
    $scope.setMute = function() {
        $scope.isMuted = !$scope.isMuted;
        Sounds.setMute($scope.isMuted);
    }

    $scope.changeVolume = function(flag) {
        var self = $scope;
        if(flag) {
            $scope.getVolume = Math.min(self.getVolume + 5, 100);
        }
        else {
            $scope.getVolume = Math.max(self.getVolume - 5, 0);
        }
        Sounds.setVolume($scope.getVolume);
    };

    /*$scope.save = function() {
        Sounds.setVolume($scope.getVolume);
        Sounds.setMute($scope.isMuted);
    }*/

    $scope.styleHUD = +storage.getItem('hudVersion', '0');
    $scope.changeStyleHUD = function() {
        $scope.styleHUD = $scope.styleHUD ? 0 : 1;
        storage.setItem('hudVersion', $scope.styleHUD);
    }

    $scope.languages = [
        {type: "en", name: "English"},
        {type: "ru", name: "Russian"},
        {type: "jp", name: "Japanese"},
        {type: "es", name: "Spanish"},
        {type: "pt-BR", name: "Portugal"},
        {type: "cz", name: "Czech"}
    ];
    $scope.curLocale = $rootScope.currentLocale;
    $scope.changeLanguage = function(type) {
        $scope.curLocale = $rootScope.currentLocale = type;
        storage.setItem('locale', $scope.curLocale);
    };
})