bombermine.controller('CloseModal', function($scope, $rootScope, $modalInstance) {
    $scope.modalClose = function () {
        $modalInstance.close();
    };
});