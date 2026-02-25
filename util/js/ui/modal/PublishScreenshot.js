bombermine.controller('PublishScreenshot', function($scope, $rootScope, $http) {
    
    $scope.visible = false;
    $scope.img = '';
    $scope.closePostSlide = function() {
        console.log('close');
        $scope.visible = false;
    }
    $rootScope.postSlide = function(i) {
        var arrImg = localStorage.img ? JSON.parse(localStorage.img) : [];
        $scope.img = arrImg[i];
        $scope.visible = true;
    }
});