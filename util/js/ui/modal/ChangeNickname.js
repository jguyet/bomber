bombermine.controller('ChangeNickname', function($scope, $rootScope, $modalInstance, $http, localize, $location) {
    $scope.clear = function() {
        $scope.msgErr = {
            'text': null,
            'style': "txt-green"
        }
        $scope.newNickname = '';
    }
    $scope.clear();
    //$scope.visible = false;
    $scope.newUser = $scope.user.nickname.indexOf("~") >= 0;
    $scope.pay = $rootScope.canChangeNickname() == "pay" ? $rootScope.shopmodel.utils.changeNick : 0;
    $scope.newNickname = $scope.user.nickname.replace("~", "");
    
    /*$rootScope.showChangeNickname = function() {
        $scope.newUser = $scope.user.nickname.indexOf("~") >= 0;
        $scope.visible = true;
        $scope.pay = $rootScope.canChangeNickname() == "pay" ? $rootScope.shopmodel.utils.changeNick : 0;
        $scope.newNickname = $scope.user.nickname.replace("~", "");
    }*/
    //special case: new user!!!
    $scope.modalClose = function() {
        //$scope.visible = false;
        $modalInstance.close();
        if ($scope.newUser) {
            $location.path("/servers/initVk")
        }
        $scope.clear()
    }
    function changeNickname() {
        $scope.msgErr = {
            text: "server_processing",
            style: "txt-green"
        }
        $scope.processing = true
        var postData = {
            newNickname: $scope.newNickname,
            pay: $scope.pay
        }
        $http.post("/api/v3/changeNickname", postData)
            .success(function(data) {
                $scope.processing = false
                $scope.modalClose()
                $rootScope.user.nickname = $rootScope.user.username = data.username
                $rootScope.user.when_update_username = data.when_update_username
                $rootScope.user.plutonium = data.plutonium
                $rootScope.user.gold = data.gold
                if (!$scope.newUser)
                    $rootScope.messageBox("Nickname changed to '" + data.username + "'",["ok"], function(result) {})
            })
            .error(function(errors, status) {
                $scope.processing = false;
                if ($scope.newUser && (errors == "nickname_denied" || status >= 500)) {
                    //no cancel button and that shit happens => FUCK IT, close the window
                    $scope.modalClose();
                    $rootScope.messageBox(localize.getString("nickname_cant_update_now"), ["ok"], function (result) {
                    })
                    return
                }
                $scope.msgErr.style = "txt-red";
                if (status >= 500)
                    $scope.msgErr.text = 'server_error';
                else
                    $scope.msgErr.text = errors;
            })
    }
    $scope.clickOk = function() {
        var err = checkNickname($scope.newNickname)
        if (err != 'ok') {
            $scope.msgErr.text = err;
            $scope.msgErr.style = 'txt-red';
        }
        else {
            if ($scope.newUser && $scope.newNickname == $rootScope.user.nickname.replace("~", "")) {
                $rootScope.messageBox($scope.newNickname+"? "+localize.getString("are_you_sure"), ["ok", "cancel"], function (result) {
                    if (result==0) {
                        changeNickname();
                    }
                });
            } else
                changeNickname();
        }
    }

    function checkNickname(nick) {
        var r=/[^a-zA-Z0-9_]/g;
        if (!nick)
            return 'nickname_must_not_be_empty';
        if(r.test(nick))
            return 'incorrect_nickname';
        if (nick.length < 3)
            return 'nickname_length_must_be_longer_then_3';
        if (nick.length > 20)
            return 'nickname_length_must_not_be_longer_then_20'
        else
            return 'ok';
    }
});
