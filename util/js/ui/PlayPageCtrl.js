bombermine.controller('PlayPageCtrl', function($scope, $rootScope, $location, $sce, $http, UserService,
                Game, Social, serverList, storage, Sounds, Tracking, i18nFilter, Realtime) {
    config.ZIndex = 0;
    config.connectOnAttach = false;
    Game.gameAttach();

    $scope.showTutorialTop = {val: true};
    $scope.changeShowTutorialTop = function(val) {
        $scope.showTutorialTop.val = val;
    }

    Game.on('gameConnectionChanged', function() {
        if (!$scope.$$phase) return $scope.$apply(function(){Game.emit('gameConnectionChanged')});
        $rootScope.showGame = Game.gameIsRunning();
        //TODO: do KG with events
        if (Game.gameIsRunning()) {
            Social.onConnect && Social.onConnect();
            if (serverList.firstConnection) {
                Tracking.track("start_connected", serverList.current.roomId);
                serverList.firstConnection = false;
            }
        }
        if ($rootScope.connectionStatus != 4)
            $rootScope.connectionStatus = Game.gameConnectionStatus();
        //window logic
        if ($rootScope.connectionStatus == 3) {
            $rootScope.showConnection = !$rootScope.showMenu;
        } else {
            if ($rootScope.connectionStatus != 0)
                $rootScope.reconnectTimer = 0;
            $rootScope.showConnection = !$rootScope.showGame;
        }
        //serverList.onChangeRoom(Game.gameRoom());
    });

    $rootScope.play = function() {
        $rootScope.banMessage = null;
        $rootScope.showMenu = false;
        if ($rootScope.connectionStatus == 3) {
            $rootScope.reconnectTimer = 0;
            serverList.autoSelect();
            //$rootScope.showRooms();
            if (serverList.tryConnect()) {
                //do something 1
            } else {
                //show that cant decide on server
            }
        }
    };

    $rootScope.play2 = function() {
        if ($rootScope.connectionStatus == 3) {
            serverList.autoSelect();
            $rootScope.showRooms();    
            //$location.path('/money/goal');
        } else {
            $rootScope.showMenu = false;
        }
    };



    Game.on("forceChangeRoom", function(roomType) {
        $rootScope.showRooms(true);
        $rootScope.$digest();
    });


    $rootScope.abort = function() {
        $rootScope.banMessage = null;
        $rootScope.reconnectTimer = -1;
        Game.gameDisconnect();
        Game.emit("gameConnectionChanged");
    };

    $rootScope.choose = function() {
        $rootScope.banMessage = null;
        $rootScope.showMenu = true;
        $rootScope.showConnection = false;
        $location.path("/servers/");
    }

    Game.on("gameEventAdmin", function(msg) {
        if(window.DEBUG) {
            console.log('gameEventAdmin:', msg);
            return;
        }
        
        if (msg.substring(0, 7) == "version") {
            var ver = msg.substring(8);
            if (ver == config.versionBad) {
                alert('Server version deffers from client version, please choose other server');
            } else {
                function setParam(path, s) {
                    if (path.indexOf(s) === -1) {
                        if (path.indexOf('?') === -1) {
                            path += '?'+s
                        } else {
                            path += '&'+s
                        }
                    }
                    return path
                }

                if (storage.isAvailable()) {
                    storage.setItem("version", ver);
                    storage.setItem("changeVersion", ver);
                    window.location.reload();
                } else {
                    window.location = location.pathname + setParam(location.search, "version="+ver) + location.hash;
                }
                $rootScope.connectionStatus = 4;
            }
            return;
        }

        
        if (msg.substring(0, 4) == "ban ") {
            var comment = "ban_msg_default";
            var i = msg.indexOf("//");
            if (i > 0) {
                comment = msg.substr(i+2);
                msg = msg.substr(0, i);
            }
            $rootScope.banMessage = $sce.trustAsHtml(i18nFilter('banned_till') + ' ' +
                new Date(+msg.substr(4)*1000) + '<br>' + i18nFilter(comment));
                //$.datepicker.formatDate('yy-mm-dd hh::mm GMT', new Date(+msg.substr(4)*1000)) +
            return;
        }
        switch(msg){
            case 'pleaseLogin':
                $rootScope.logout();
                break;
            case 'kick':
            //DEPRECATED
                alert('You have been kicked');
                break;

            case 'playersLimitExceeded':
                alert('Players limit exceeded. Try again later.');
                $location.path('/');
                break;

            case 'disconnect':
                alert('Disconnected from server');
                $location.path('/');
                break;

            case 'duplicate':
                alert('You connected from other browser');
                break;
            default: 
                Game.emit('gameEventNetDisconnect');
                break;
        }
    })

    Game.on('gameEventNetDisconnect', function(reconnectInterval) {
        if ($rootScope.connectionStatus == 0) {
            //connection failed
            var tt = $rootScope.reconnectTimer;
            serverList.failsafe(tt>=0?6-tt:1);
        }
        if ($rootScope.reconnectTimer == -1) return;
        var connTimeout;
        var callback = function () {
            if ($rootScope.reconnectTimer > 0) {
                $rootScope.reconnectTimer --;
                if ($rootScope.reconnectTimer==0)
                    $rootScope.reconnectTimer = -1;
                Game.gameConnect();
                if (Game.gameConnectionStatus() == 2) {
                    connTimeout = setTimeout(callback, reconnectInterval || 3000);
                    return;
                }
                if (Game.gameConnectionStatus() != 1) {
                    $rootScope.$apply(function () {
                        $rootScope.$broadcast('clear chat')
                    });
                }
            }
        }
        if ($rootScope.reconnectTimer == 0)
            $rootScope.reconnectTimer = 5;
        Game.gameDisconnect();
        connTimeout = setTimeout(callback, reconnectInterval || 3000);
    })

    Game.on('gameEventRoundEnd', function(data) {
        if (!data)
            return;

        //nothing here
        //UserService.updateCurrentUser();
        //$rootScope.check_for_notifications();
/*        var user = $rootScope.user;
        user.money += data.score;
        user.kills += data.kills;
        user.deaths += data.deaths;
        user.football_goals += data.football_goals;
        user.rounds_played += 1;
        if (data.medal==1)
            user.gold_medals++;
        if (data.medal==2)
            user.silver_medals++;
        if (data.medal==3)
            user.bronze_medals++;
        user.score = (user.money / 10 + user.kills * 20 + user.football_goals * 120)|0;*/
    })


    $scope.msgHello = function() {
        window.gameEventChat(
            'bombermine',
            '! Hey! We\'re inviting:\n 1. Country community leaders\n2. Moderators\n3. Translators\n4. Artists/Illustrators\n5. Skinmakers\n\nAlso we\'re welcome for partnership in hosting servers for your country.\nLet us know via bombermine.com@gmail.com',
            true,
            0
        );
    }

    var fullScreen = 0;
    var resizeHandler = function () {
        if (fullScreen) {
            var v = $('#viewport');
            Game.gameSetViewportSize(v.outerWidth(), v.outerHeight());
        } else {
            Game.gameSetViewportSize(800, 600);
        }
    }
    
    $scope.toggleFullScreen = function(on) {
        fullScreen = on || !fullScreen;
        resizeHandler();
    }

    $scope.toggleFullScreen();

    $(window).on('resize', resizeHandler);
    var _w = 0, _h = 0;
    function checkResize() {
        var v = $('#viewport');
        var w = v.outerWidth(), h= v.outerHeight();
        if (w!=_w ||h!=_h) {
            _w = w;
            _h = h;
            resizeHandler();
        }
    }
    var resizeInterval = setInterval(checkResize, 1000)


    $scope.$on('$destroy', function() {
        $(window).unbind('resize', resizeHandler);
        clearInterval(resizeInterval)
        console.log('PlayPageCtrl destroy');
        $rootScope.reconnectTimer = -1;
        Game.gameDetach();
    });

    $scope.changeH = function() {
        $scope.msgH = angular.element('#msgText')[0].scrollHeight;
        $scope.msgH1 = angular.element('#msgText')[0].offsetHeight;
        $scope.msgH2 = angular.element('#msgText')[0].clientHeight;
        /*console.log($scope.msgH);
        console.log($scope.msgH1);
        console.log($scope.msgH2);*/
        //console.log(angular.element('#msgText'));
        //$('#listChat').scrollTo(0,100%);
        $scope.msgBott = 114 - $scope.msgH;
        if ($scope.msgBott < 0)
            $scope.msgBott = 0;
    }

    serverList.doAfterInit(function() {
        if (storage.getItem("changeVersion") || page_params && page_params["version"]) {
            $rootScope.play();
            storage.removeItem("changeVersion");
        }
    });
    $scope.changeH();

    Game.on("questContext", function(msg) {
        //console.log("game questContext '"+msg+"'");
        msg = msg.replace("[Space]","<div class='key'>Space</div>");
        $scope.context = $sce.trustAsHtml(msg);
        $scope.showContext = msg.length != 0;
        $scope.$digest();
    })
    Game.on("achievementGet", function(msg) {
        //TODO: move it to service
        Social.onCompleteTutorial && Social.onCompleteTutorial();
        $rootScope.setTutorLevel(1);
        /*$http.get('/api/v3/bonuses/progress').success(function (data) {
            $rootScope.progress = data;
        })*/
        UserService.updateCurrentUser();
        $rootScope.check_for_notifications()
    })
});