bombermine.controller('ChangePassword', function($scope, $rootScope, $http) {

    /*$scope.modalClose = function() {
        $scope.visible = false;
        clear();
    }*/

    // ************************ CHANGE PASSWORD **********************************
    function clear() {
        $scope.dontAskOld = false;
        $scope.forceChange = false
        $scope.isOldPasswordWrong = false
        $scope.errors = {}
        $scope.newPassword = ""
        $scope.newPassword2 = ""
        $scope.oldPassword = ""
        $scope.processing = false
        $scope.msgErr = {
            'text': null,
            'style': 'txt-green'
        }
    }
    clear();
    $scope.msgErr = {
        'text': null,
        'style': 'txt-green'
    }
    $scope.checkNewPass = function (pass) {
        if (pass.length < 5)
            return 'password_length_must_be_greather_5';
        if (pass.length > 20)
            return 'password_length_must_be_shorter_20 characters';
        else
            return 'ok';
    }

    $scope.checkPass = function(newPass, newPass2, oldPass) {
        if ($scope.checkNewPass(newPass) != 'ok')
            return $scope.checkNewPass(newPass);
        else if (newPass != newPass2)
            return 'passwords_do_not_match';
        else if (oldPass == '' && !$scope.dontAskOld)
            return 'old_password_is_empty';
        else
            return 'ok';
    }
    $scope.changePassword = function() {
        $scope.msgErr = {
            text: "server_processing",
            style: "txt-green"
        }
        $scope.processing = true
        var postData = {
            newPassword: $scope.newPassword,
            oldPassword: $scope.oldPassword
        }
        $http.post("/api/v3/changePassword", postData)
            .success(function(data) {
                $scope.processing = false
                $scope.modalClose();
                //TODO: i18nfilter!
                $rootScope.user.pwdStatus = "changed";
                $rootScope.messageBox("password_changed",["ok"], function(result) {});
            })
            .error(function(errors, status) {
                $scope.processing = false
                $scope.msgErr.style = "txt-red";
                if (status == 0) {
                    $scope.msgErr.text = 'server_no_connection';
                    $scope.forceChange = false;
                }
                else if (status >= 500) {
                    $scope.msgErr.text = 'server_error';
                    $scope.forceChange = false;
                }
                else
                    $scope.msgErr.text = errors.newPassword || errors.oldPassword;
            })
    }
    $scope.clickOk = function() {
        var err = $scope.checkPass($scope.newPassword, $scope.newPassword2, $scope.oldPassword)
        if (err != 'ok') {
            $scope.msgErr.text = err;
            $scope.msgErr.style = 'txt-red';
        }
        else {
            $scope.changePassword();
        }
    }
    /*$rootScope.showChangePassword = function() {
        $scope.visible = true;
    }*/

    var user = $rootScope.user;
    $scope.dontAskOld = !user.pwd_status;
    if (user.providerId == "recover" && user.pwd_status == 'recovering' ||
        user.identities.filter(function(x) { return x!="tibia" }).length == 0) {
        $scope.visible = true;
        $scope.forceChange = true;
        $scope.dontAskOld = true;
    }
});