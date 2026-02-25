bombermine.controller('RootCtrl', function($scope, $rootScope, $location, $http, localize, storage, UserService, ShopService, serverList, Keys, Social, $sce, Game, Realtime) {
    console.log('RootCtrl init');

    $rootScope.min = Math.min;

    $rootScope.Social = Social;
    $rootScope.state = {};
    $rootScope.browserSupport = !!window.WebSocket;

    //$rootScope.chatRight = storage.getItem('chatRight', (Math.random()*2|0)?"true":"false") == "true";
    $rootScope.chatRight = storage.getItem('chatRight', "false") == "true";
    //landing!
    $rootScope.$watch("user.is_guest", function(val) {
        $rootScope.landingName = val?"1":(config.regLanding || "3");
    });

    $rootScope.switchLanding = function() {
        $rootScope.landingName = 5 - $rootScope.landingName;
    };

    //SPECIAL FALLBACK
    if (($location.path()=="/" || $location.path()=="") && $rootScope.user.score==0 && !$rootScope.user.region && !config.defaultRoom) {
        $location.path("/start/");
    }

    function loginEvent() {
        //serverList.init($rootScope.config.servers);
        serverList.init($rootScope.user.servers);
        serverList.doPing()
        Realtime.onLogin()
        Social.onLogin()
        if (config.defaultRoom) {
            setTimeout(function () {
                serverList.current.serverId = config.defaultServer;
                serverList.current.roomId = config.defaultRoom || 0;
                $rootScope.play();
            }, 500);
        }
    }
    function readyEvent() {
        if ($rootScope.user.id != 0) loginEvent();
        else $rootScope.$on("login", loginEvent)
        if (!$rootScope.$$phase) $rootScope.$digest()
    }
    if (Social.ready) readyEvent();
    else $rootScope.$on("socialReady", readyEvent);

    // This addition is untested. It's unknown if "swicth" ever fires.
    // But it seems necessary to update serverList with a new user.
    $rootScope.$on("swicth", loginEvent);

    //GAME & MENU STATE:

    // show the game
    $rootScope.showPlay = false;
    // show overlay
    $rootScope.showMenu = true;
    // show connection window
    $rootScope.showConnection = false;
    // reconnect timer (for connection window)
    $rootScope.reconnectTimer = 0;
    // websocket status (0 connecting, 1 opened, 2 disconnecting, 3 disconnected, 4 - UPDATING CLIENT
    $rootScope.connectionStatus = 3;

    Keys.lockOnTrue($rootScope, 'showMenu', 'menu');

    $rootScope.profileTab = null;
    $rootScope.openProfile = function(profileTab) {
        $rootScope.profileTab = profileTab;
        $location.path("/");
    }

    $rootScope.menu = function() {
        $rootScope.showMenu = true;
    }

    $rootScope.topBannerHeight = config.showTopBanner?95:0;

	// used in leftbar.tmpl to determine the menu elemets height
    $rootScope.menuStyle = function() {
		var usedSpaceHeight = 300 + $rootScope.topBannerHeight;
		var itemBaseHeight = 26;
		var nItems = $("#sideMenuUl li").length;		
		var p = ~~Math.max(0, Math.min(16, // total vertical padding
			(($(window).height() - usedSpaceHeight - itemBaseHeight * nItems) / nItems)));
		return {'padding-top': ''+(p>>1)+'px', 'padding-bottom': ''+(p-(p>>1))+'px'};
    }		
    
    $rootScope.online = {total: 0};
    $rootScope.askOnline = function(callback) {
        $http.get('/api/v3/online').success(function(data) {
            $rootScope.online = data
            if (callback) callback();
        }).error(function(err, status) {
            if (callback) callback();
        }) 
    }
    $rootScope.askOnline();
    
    localize.init();

    $rootScope.getPermission = function(value) {
        var player = $rootScope.user;

        if (!!player && (player.perm_mask & value) != 0)
            return true
        else
            return false;
    }

    $rootScope.getIconPosition = function(index, dx, dy, x, y) {
        var U = 'undefined';

        dx = typeof(dx) === U ? 0 : dx;
        dy = typeof(dy) === U ? 0 : dy;
        x  = typeof(x)  === U ? 0 : x;
        y  = typeof(y)  === U ? 0 : y;

        return { 'background-position': (x - (index * dx)) + 'px ' + (y - (index * dy)) + 'px' };
    }

    $scope.logout = function () {
        location.href = "/logout?auth="+(config.auth||"b")
        /*$http.post('/api/v3/user/logout').success(function() {
            $rootScope.user = null;
            $rootScope.bgHidden = true;

            delete localStorage['game/player'];
            delete sessionStorage['game/player'];
            UserService.checkRedirects();
            $location.path('/');
        });*/
    }

    $rootScope.$watch(ShopService.getModel, function(newVal) { $rootScope.shopmodel = newVal; });

    var tutorLevel = 0;
    $rootScope.$watch("progress", function(newVal, oldVal) {
        tutorLevel = 0;
        for (var i=0; i<newVal.bonuses.length; i++)
            if (newVal.bonuses[i].bonus_type=="tutorial") {
                tutorLevel = newVal.bonuses[i].bonus_level;
                break;
            }
        if ($rootScope.connectionStatus>=3) {
            serverList.checkIfTutor();
        }
    });
    $rootScope.tutorLevel = function() {
        return tutorLevel;
    };
    $rootScope.setTutorLevel = function(val) {
        var newVal = $rootScope.progress
        for (var i=0; i<newVal.bonuses.length; i++)
            if (newVal.bonuses[i].bonus_type=="tutorial") {
                newVal.bonuses[i].bonus_level = val;
            }
    };

    $rootScope.getForumLink = function() {
        if (config.auth == 'vk')
            return $sce.trustAsResourceUrl("//gameofbombs.com/?section=2aec1bca-b261-4518-b042-a42f7be6efc5&token="+$rootScope.user.token);
        else
            return $sce.trustAsResourceUrl("//gameofbombs.com/?token="+$rootScope.user.token);
    }

    $rootScope.openForum = function() {
        window.open("//gameofbombs.com/community/");
    }
    //$scope.h = ($(window).height() > 1024) ? $(window).height() : $(window).height() + 91;
    $scope.$watch(function() {
        return {
            'w': $(window).width(),
            'h': $(window).height() - $rootScope.topBannerHeight
        };
    }, function(newVal, oldVal) {
        $scope.h = newVal.h;
        $scope.w = newVal.w;
    }, true);

    var resizeWndTimer =  setInterval(function() {
        if (($scope.h != $(window).height() - $rootScope.topBannerHeight) || ($scope.w != $(window).width())){
            $scope.h = $(window).height() - $rootScope.topBannerHeight;
            $scope.w = $(window).width();
            $scope.$digest()
        }
    }, 300);

    $scope.showTestModal = function() {
        $rootScope.messageBox("are_you_sure", ["ok", "cancel"], function (result) {
            alert(result);
        });
    }

    $scope.askLogout = function() {
        if (!Social.active) {
            $rootScope.messageBox("are_you_sure", ["ok", "cancel"], function (result) {
                if (result == 0) {
                    location.href = "/logout?auth=" + (config.auth || "b")
                }
            });
        } else {
            if ($rootScope.user.is_guest) {
                $rootScope.reconnectTimer = -1;
                Game.gameDisconnect();
                $rootScope.user.id = 0;
            }
        }
    }
    /*$scope.askLogoutInGame = function() {
        $rootScope.messageBox("You will lose your guest progress. Are you sure? ", ["ok", "cancel"], function (result) {
            if (result==0) {
                location.href = "/logout?auth="+(config.auth||"b")
            }
        });
    }*/

    $rootScope.logout = function() {
//        if (Social.active) {
            $rootScope.messageBox("auth_error", [], function (result) {});
/*        } else {
            location.href = "/logout?auth=" + (config.auth || "b")
        }*/
    }

    $rootScope.showTrialPay = function() {
        $rootScope.iframeLightBox("https://www.trialpay.com/dispatch/1244083a86d7551a622d9a729598f97e?sid="+$rootScope.user.id+"&domain="+$rootScope.config.auth, 760, 2400);
//        <iframe width="760" height="2400" scrolling="auto" frameborder="0" style="border: 1px none white;" src="https://www.trialpay.com/dispatch/1244083a86d7551a622d9a729598f97e?sid="></iframe>
    }
    $rootScope.checkFlash = function() {
        var flashinstalled = false;
        if (navigator.plugins) {
            if (navigator.plugins["Shockwave Flash"]) {
                flashinstalled = true;
            }
            else if (navigator.plugins["Shockwave Flash 2.0"]) {
                flashinstalled = true;
            }
        }
        else if (navigator.mimeTypes) {
            var x = navigator.mimeTypes['application/x-shockwave-flash'];
            if (x && x.enabledPlugin) {
                flashinstalled = true;
            }
        }
        else {
            // на всякий случай возвращаем true в случае некоторых экзотических браузеров
            flashinstalled = true;
        }
        return flashinstalled;
    }

    $rootScope.goMoneyOrRegister = function() {
        if ($rootScope.user.is_guest && Social.active && Social.showRegister) {
            Social.showRegister();
            setInterval(function() {
                $rootScope.path = "profile";
                $location.path("/profile/");
            });
        } else {
            $rootScope.path = "money";
        }
    }
    
    /**
    * Allows fully registered users to proceed or ask them to registered
    * or confirm e-mail.
    * @return true if the user is not fully registered and somwething was shown
    */
    $rootScope.cantBuyAskRegister = function() {
        if ($rootScope.user.canBuy())
            return false;
        $rootScope.showRegister();
        return true;
    }

    // useful in tmpl (which doesn't support & and |)
    $rootScope.bitwiseOr  = function(a, b) { return a | b; };
    $rootScope.bitwiseAnd = function(a, b) { return a & b; };
});
