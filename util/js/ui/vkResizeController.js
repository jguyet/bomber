bombermine.controller('ResizeController', function($http, $scope, $rootScope, Social, storage) {
    var size_old = JSON.parse(storage.getItem('game_vk_viewport_size', '{}'));
    if (!Social.resizeTo)
        size_old = {}

    $scope.resizeOptions = [
        { width: 1000, height: 600 },
        { width: 1000, height: 700 },
        { width: 1000, height: 800 }
    ];

    $scope.resizeView = function(size) {
        $scope.setFullscreen(false);
        if (Social.resizeTo)
            Social.resizeTo(size.width, size.height + $rootScope.topBannerHeight);
        else
            window.resizeTo(size.width, size.height + $rootScope.topBannerHeight);
        size_old.selected = false;
        size_old = size;
        size.selected = true;
        storage.setItem('game_vk_viewport_size', JSON.stringify(size));
    }
        
    $scope.isFullscreen = function() {
        if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) return true;
		return false;
    }    
    
    $scope.setFullscreen = function(value) {
        var fs = $scope.isFullscreen();
        if (fs != value) {
            if (fs) {
                if (document.cancelFullScreen) {
                    document.cancelFullScreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
            } else {
				if (value)
					size_old.selected = false;
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            }
        }
    }

    if (size_old.width && size_old.height) {
        $scope.resizeOptions.forEach(function(size) {
            if (size_old.width == size.width && size_old.height == size.height) {
                size_old = size;
                size.selected = true;
            }
        });

        $scope.resizeView(size_old);
    } else if (Social.resizeTo) {
        $scope.resizeView($scope.resizeOptions[0]);
    }
});