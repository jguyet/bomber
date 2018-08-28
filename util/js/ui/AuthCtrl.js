bombermine.controller('AuthCtrl', function($scope, $rootScope, $location, $sce, $http, UserService, i18nFilter, i18nHtmlFilter, localize, SafariHack) {
    $scope.recoveryForm = {};
    (function() {
        var user = $rootScope.user
        $scope.registerForm = {
            username: $rootScope.user.nickname2 || "",
            referrer: user.referrer,
            referral: user.referral,
            session: user.session
        };
        $scope.loginForm = {
            username: "",
            pwd: "",
            referrer: user.referrer,
            referral: user.referral,
            session: user.session
        };
        $scope.guestForm = {
            referrer: user.referrer,
            referral: user.referral
        }
    })();

    $scope.registerErrors = {};
    $scope.modal = false;
    $scope.recoveryResult = '';
    $scope.recoveryErrors = {};

    $scope.loginErrors = {};
    $scope.guestErrors = {};

    $scope.processing = false;
    $scope.emailPattern = /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/i;
    $scope.nickEmailPattern = /(^[a-z0-9_]{3,20}$)|(^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$)/i;

    function error_function(name) {
        function isPlainObject(o) {
            return !!o && typeof o === 'object' && o.constructor === Object;
        };
        return function (data, status) {
            if (status >= 500) {
                data = "unknown_error";
            }
            console.log('error', data);
            if (isPlainObject(data)){
                var errors = [];
                for(var key in data){
                    errors.push(localize.getString(data[key]));
                    $scope[name]['common'] = errors.join(', ');
                    $scope.processing = false;
                }
            } else {
                $scope[name]['common'] = localize.getString(data);
                $scope.processing = false;
            }
        };
    }

    //TODO: GA метрики?
    $scope.register = function(form){
        $scope.processing = true;
        SafariHack(function() {
            $http.post('/api/v3/user/registerId', $scope.registerForm).success(function (data) {
                UserService.setFullData(data)
                $location.path("/start/")
            }).error(error_function('registerErrors'));
        })
    };

    $scope.login = function(){
        $scope.processing = true;
        SafariHack(function() {
            $http.post('/api/v3/user/loginId', $scope.loginForm).success(function (data) {
                UserService.setFullData(data)
                $location.path("/")
            }).error(error_function('loginErrors'))
        })
    };

    $scope.guest = function(){
        $scope.processing = true;
        SafariHack(function() {
            $http.post('/api/v3/user/guest', $scope.guestForm).success(function (data) {
                UserService.setFullData(data)
                $location.path("/start/")
            }).error(error_function('guestErrors'))
        })
    };

    $scope.signup = function() {
        if (config.auth=="kong") {
            kongregate.services.showRegistrationBox();
        }
    }
});