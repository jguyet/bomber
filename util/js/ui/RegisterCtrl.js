bombermine.controller('RegisterCtrl', function($scope, $rootScope, $location, $http, UserService) {
	$scope.form = { email: "", pwd: "", username: "", referrer: document.referrer }
	$scope.processing = false;
	
	function error_function(data, status) {
        if (status >= 500) {
            data = { nickname : "c_server_error" };
        }
        $scope.errors = data;
        $scope.processing = false;
    };
	$scope.auth = function (action) {
		var errors = $scope.errors = {}
        var form;

        form = $scope.form;
        if (errors.email = Utils.validateEmail(form.email)) errors.exist = true;
        if (errors.pwd = checkPass(form.pwd)) errors.exist = true;
        if (errors.nickname = check_username(form.username)) errors.exist = true;

        console.log($scope.errors);
		if (!errors.exist) {
			$scope.processing = true;
			$http.post('/api/v3/user/'+action, form).success(function(data) {
                UserService.setUserData(data);
                $rootScope.config.token = data.token;
				$location.path("/")
                $rootScope.$broadcast("register");
			}).error(error_function)
			console.log($scope.errors);
		}
		console.log($scope.errors);
    }
	
	function check_username(nickname) {
		console.log(nickname)
		if (nickname == "") {console.log('empty'); return ("nickname_must_not_be_empty")}
		else if (nickname.length > 20) return ("nickname_length_must_not_be_longer_then_20")
		else if (nickname.length < 3) return ("nickname_length_must_be_longer_then_3")
		else if (!(/^[a-zA-Z0-9_]+$/.test(nickname))) return ("incorrect_nickname")
		else return false
	}
	
	function checkPass(password){
		if (password=="") return "password_must_not_be_empty";
		if (password.length > 20) return "password_length_must_not_be_greather_then_20";
		if (password.length < 5) return "password_length_must_not_be_less_then_5";
		return false;
	}
})