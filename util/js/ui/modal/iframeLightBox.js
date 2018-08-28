bombermine.controller('iframeLightBox', function($scope, $rootScope, $sce) {
    $scope.visible = false;
    $rootScope.iframeLightBox = function(link, w, h) {
        
        $scope.visible = true;
        
        $scope.link = $sce.trustAsResourceUrl(link);
        $scope.w = w;
        $scope.h = $(window).height()-100;
    }
    $scope.modalClose = function() {
        $scope.visible = false;
    }

});