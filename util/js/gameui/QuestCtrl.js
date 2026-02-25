bombermine.controller('QuestCtrl', function($location, $scope, $rootScope, Game, $sce, Keys, storage) {

    $scope.tut_step = 0;
    var isSound = false;
    $scope.isHamster = false;
    $rootScope.isBgGreen = false;
    $scope.message = '';
    var prev_mask = 0;
    function init() {
        console.log("tutorial init");
        //browser tracking
        var screenW = window.screen.width;
        var screenH = window.screen.height;
        var browser = window.navigator.userAgent;
        var platform = window.navigator.platform;
        _gaq.push(['_trackEvent', 'Tutorial', 'load_system', 'w:' + screenW + '; h:' + screenH + '; platform:' + platform + '; browser:' + parseBrowser(browser)]);
        //keys tracking
        
        Keys.listener = function (mask) {
            if ((mask & prev_mask) == mask) return;
            var pi = Game.getPlayerInfo();
            if (!pi || !pi.alive) return;
            for (var i = 0; i < 6; i++) {
                if ((prev_mask & (1 << i)) == 0 &&
                    (mask & (1 << i)) != 0) {
                    _gaq.push(['_trackEvent', 'Tutorial', 'key_down', 'key_down:' + i + '; step:' + $scope.message+'; number:'+$scope.tut_step]);
                }
            }
            prev_mask |= mask;
        }
        //SPLIT TESTS
        $scope.isHamster = Math.random() * 2 | 0;
        $rootScope.isBgGreen = Math.random() * 2 | 0;
        //second split test
        isSound = Math.random() * 2 | 0;
        if (isSound && $rootScope.jpPlay) $rootScope.jpPlay();
        /*if (storage.getItem("sounds", "AUTO") == "AUTO") {

            Sounds.setMuteDontSave(!isSound);
        }*/
    }

    function stop() {
        console.log("tutorial stop");
        Keys.listener = null;
        //split test 2
        /*if (storage.getItem("sounds", "AUTO") == "AUTO")
            Sounds.setMuteDontSave(true);*/
    }

    $scope.$watch("quest_visible", function(newValue, oldValue) {
        if (newValue) init();
        else stop();
    })

    Game.on("questMessage", function (msg) {
        //console.log("game questMessage '"+msg+"'");
        prev_mask = 0;
        if (msg == 'start1')
            $scope.tut_step = 0;
        _gaq.push(['_trackEvent', 'Tutorial', 'load_msg_'+msg, $scope.tut_step+'; hamster:'+$scope.isHamster+'; sound:'+isSound+'; bg-green:'+$rootScope.isBgGreen]);
        msg = msg.replace("[Space]", "<div class='key'>Space</div>");
        $scope.tut_step++;
        $scope.message = msg;
        //$scope.message = $sce.trustAsHtml(msg);
        $scope.showMessage = msg.length != 0;
        $scope.$digest();
    })

    $scope.$on("$destroy", function() {
        stop();
    });

    $scope.tutStyleHamster = function() {
        return $scope.isHamster;
    };

    function parseBrowser(str) {
        if (str.search(/Chrome/) > 0) return 'Google Chrome';
        if (str.search(/Firefox/) > 0) return 'Firefox';
        if (str.search(/Opera/) > 0) return 'Opera';
        if (str.search(/Safari/) > 0) return 'Safari';
        if (str.search(/MSIE/) > 0) return 'Internet Explorer';
        return 'other';
    }
})

bombermine.controller('QuestItemsCtrl', function($location, $scope, $rootScope, Game, $sce) {
})

bombermine.directive('helpItem', function () {
    return {
        restrict: 'AE',
        transclude: true,
        scope: {
            itemName: "@helpItem",
            sprites: "=sprites",
            timeout: "@timeout"
        },
        templateUrl: 'tmpl/quest/helpItem.tmpl',
        link: function (scope, element) {
            scope.itemStyle = window.sprites.getStyle("items-"+scope.itemName)
            scope.t = scope.timeout || 5000;
            scope.show = function(value) {
                scope.open = value;
                if (!scope.height)
                    scope.height = element.height();
                if (scope.height)
                    element.height(scope.height+'px');
                if (value) {
                    //console.log(angular.element(element.children('.help2')).width())
                    element.addClass("help-open");
                    element.removeClass("help-close");
                    if (scope.height)
                        element.height(scope.height+'px');
                } else {
                    element.addClass("help-close");
                    element.removeClass("help-open");
                    element.height('32px');
                }
                
            }
            scope.show(1);
            scope.idTimeout = window.setTimeout(function() {scope.show(0);}, scope.t);
            //console.log(scope.timeout)
            element.bind('click', function() {
                window.clearTimeout(scope.idTimeout);
                scope.show(1);
                scope.idTimeout = window.setTimeout(function() {scope.show(0);}, scope.t);
            })
        }
    };
});