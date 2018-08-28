bombermine.controller('ShowRooms', function($scope, $rootScope, $modalInstance, params) {
    //$scope.visible = false;
    $scope.params = params;
    $scope.doFilter = $scope.params.doFilter || false;
    $scope.trackRoomKey = $scope.params.trackRoomKey || false;

    $scope.filter = function(roomType) {
        return !$scope.doFilter || roomType == "hardcore" ||
                roomType == "sandbox" || roomType == "pvm";
    }

    /*$rootScope.showRooms = function(hideTutor) {
        $scope.doFilter = hideTutor;
        $scope.trackRoomKey = hideTutor?"tutor_next_room":false;
        $scope.visible = true;
    }
    $scope.modalClose = function() {
        $scope.visible = false;
    }*/
    $scope.modalClose = function () {
        $modalInstance.close();
    };

});