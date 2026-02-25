bombermine.controller('RoomCtrl', function($scope, $rootScope, $location) {
	$scope.roomSelect = 0;
	$scope.arrRooms = [
		{'name': 'Hardcore', 'players': '7', 'time': '10.09'},
		{'name': 'Teamplay', 'players': '11', 'time': '11.45'},
		{'name': 'name1', 'players': '9', 'time': '07.08'},
		{'name': 'name2', 'players': '2674', 'time': '03.54'}
	];

	$scope.changeRoom = function(i) {
		$scope.roomSelect = i;
	}
})