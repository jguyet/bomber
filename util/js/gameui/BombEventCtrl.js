bombermine.controller('BombEventCtrl', function($location, $scope, $rootScope, $http) {

$scope.disable_buttons_flag = false;
	
	$scope.buyPumpkin = function() {
		$scope.disable_buttons_flag = true;
		$http.post("/api/v3/buyCountPerk", { name: "pumpkin_bomb", count: $scope.pumpkin_number, currency: "plutonium" })
			.success(function(data) {
				$scope.user.plutonium = data.plutonium;
				$scope.user.gold = data.gold;
				$scope.disable_buttons_flag = false;
				Game.appInputRejoin();
				$scope.purchase_msg = true;
				$scope.purchase_msg_success = true;
				$scope.purchase_msg_nepu = false;
			}).error(function() {
				$scope.disable_buttons_flag = false;
				$scope.purchase_msg = true;
				$scope.purchase_msg_success = false;
				$scope.purchase_msg_nepu = true;
			}) 
	}
	
	$scope.pumpkin_number =50;
	$scope.disable_buttons_flag=false;
	$scope.purchase_msg = false;
	
	update_pu_amount = function(){																									
		$scope.pu_amount = Math.ceil($scope.pumpkin_number/2);            
		$scope.bonus_amount = Math.floor($scope.pumpkin_number/50) *5;	
		//$scope.purchase_msg_nepu = ($scope.pu_amount <= $scope.user.plutonium);
	}
	 
	update_pu_amount();	
	$scope.pumpkin_more = function(){

	if ( $scope.pumpkin_number < 990)	$scope.pumpkin_number +=10;	
	update_pu_amount();
	}

	$scope.pumpkin_less = function(){
	
	if ( $scope.pumpkin_number  >10)	$scope.pumpkin_number -=10;
	update_pu_amount();
	}

	$scope.update_pu = function(){

	if (parseInt($("input.pumpkin_number").val()) > 0)  $scope.pumpkin_number = parseInt($("input.pumpkin_number").val())

	else  if ( parseInt($("input.pumpkin_number").val())  <= 0)   $("input.pumpkin_number").val(1);

	update_pu_amount();
	}


});