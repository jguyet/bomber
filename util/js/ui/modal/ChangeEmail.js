bombermine.controller('ChangeEmail', function($scope, $rootScope, $http) {

    /*$scope.modalClose = function() {
        $scope.visible = false;
        clear();
    }*/

    // ************************ CHANGE EMAIL **********************************
    function clear() {
        $scope.forceChange = false
        $scope.errors = {}
        $scope.newEmail = $rootScope.user.email
        $scope.processing = false
        $scope.msgErr = {
            'text': null,
            'style': 'txt-green'
        }
    }
    $scope.checkEmail = function(email) {
        var pattern = /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/i;
        if (email=="") return "email_must_not_be_empty";
        if (!pattern.test(email)) return "incorrect_email";
        return 'ok';
    }
    clear();
    $scope.msgErr = {
        'text': null,
        'style': 'txt-green'
    }
    $scope.changeEmail = function() {
        $scope.msgErr = {
            text: "server_processing",
            style: "txt-green"
        }
        $scope.processing = true
        var postData = {
            newEmail: $scope.newEmail
        }
        $http.post("/api/v3/changeEmail", postData)
            .success(function(data) {
                $scope.processing = false
                $scope.modalClose();
                //TODO: i18nfilter!
                $rootScope.user.email = $scope.newEmail;
                $rootScope.messageBox(data, ["ok"], function(result) {});
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
                    $scope.msgErr.text = errors;
            })
    }
    $scope.clickOk = function() {
        var err = Utils.validateEmail($scope.newEmail)
        if (err) {
            $scope.msgErr.text = err;
            $scope.msgErr.style = 'txt-red';
        }
        else {
            $scope.changeEmail();
        }
    }
    /*$rootScope.showChangeEmail = function() {
        $scope.visible = true;
    }*/
});