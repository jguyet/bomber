/**
 * Created by Ivan on 16.10.2014.
 */
bombermine.controller('TabMenuCtrl', function($location, $scope, $rootScope, $http, localize, Social, Keys, Game, skinModel) {
    //special for abilities
    $rootScope.respawned = false; // TODO: remove
    $rootScope.clientCanChangePerks = true;

    $scope.activeTab = 'stats';

    $scope.eventNum = 6;
    $scope.firstTimeSeeEvent = false;
    
    $scope.setActiveTab = function(tab) {
        if ($scope.activeTab == tab)
            return;
        if ($scope.eventNum && $scope.activeTab == 'action' && $scope.firstTimeSeeEvent)
            saveEvent($scope.eventNum);
        $scope.activeTab = tab;
        $rootScope.$emit('tabMenuTab', tab);
    }

    var TITLES = ['none', 'scores', 'respawn', 'round_start',
                  'round_end', 'help_respawn', 'help_buy_powerup', 'quest',
                  'perks', 'skins'];
    $scope.menuState = 0;
    $scope.changeShowTutorialTop(false);
    $scope.menuTitle = 'none';

    function getEventNum() {
        try {
            return localStorage["event"] || 0;
        } catch (e) {
            return 1000;
        }
    }

    function saveEvent(num) {
        try {
            localStorage["event"]  = num
        } catch (e) {
        }
    }

    function chooseTab() {
        if ($scope.menuState == 8) {
            $scope.setActiveTab('perks');
        } else if ($scope.menuState == 5 || $scope.menuState == 7) {
            $scope.setActiveTab('quest');
        } else if ($scope.menuState == 3 && $scope.user.isRegistered()) {
            //ADVERTISING AT ROUND START!!
            if (!config.hideEvents && (getEventNum()<$scope.eventNum || Math.random()<0.2)) {
                //1. try to advertise an event/project, because client didnt see it yet or random
                $scope.firstTimeSeeEvent = true;
                $scope.setActiveTab('action');
            } else if ($scope.skins_visible == 2) {
                //2. advertise skins!
                $scope.setActiveTab('skins');
            } else {
                //3. perks
                $scope.setActiveTab('perks');
            }
        } else {
            if ($scope.canRespawn) {
                if (!$scope.user.isRegistered() && $scope.menuState < 5) {
                    $scope.setActiveTab('register');
                } else
                    $scope.setActiveTab('stats');
            } else
                $scope.setActiveTab('stats');
        }
        
    }

    function changeMenu(menuState) {
        $scope.menuState = menuState;
        $scope.changeShowTutorialTop($scope.menuState <= 0);
        $scope.menuTitle = TITLES[$scope.menuState];
        if (!menuState) {
            // these 2 are supposedly faster than a single $rootScope.$broadcast
            $scope.$broadcast("tabMenuClose");
            $rootScope.$emit("tabMenuClose");
            return;
        }
        $scope.observing = Game.appObserverMode();
        var pi = Game.getPlayerInfo();
        //TODO: refactor this ASAP
        $scope.canRespawn = menuState == 2 || menuState == 3 || menuState == 5 || menuState == 6 || menuState==8 && pi && !pi.alive;
        // set $scope.skins_visible it before chooseTab, so it can open at once
        $scope.skins_visible = 0;
        if (config.showSkinAds == 1) {
            $scope.skins_visible = (!skinModel.ownsCtorSkin && !skinModel.ownsSkin || Math.random()<0.05 && menuState==3) ? 2:0;
        } else if (config.showSkinAds == 2) {
            $scope.skins_visible = (!skinModel.ownsCtorSkin && !skinModel.ownsSkin || Math.random()<0.2) ? 2:1;
        }
        chooseTab();
        if (menuState == 5 || menuState == 6)
            $scope.boardButtons = "respawn_only"
        else {
            if ($scope.canRespawn)
                $scope.boardButtons = "respawn"
            else
                $scope.boardButtons = (menuState == 4 && canShare()) ? "wallpost" : "observe";
            if ($rootScope.config.debugWallpost)
                $scope.boardButtons = "wallpost";
        }
        $scope.tutor['help_respawn'] = menuState == 5? "respawn": null;
        $scope.$broadcast("tabMenuOpen", $scope.activeTab);
        $rootScope.$emit("tabMenuOpen", $scope.activeTab);

        /*задаём меню*/
        $scope.quest_visible = $scope.menuState>=5 && $scope.menuState<=7;
        
        $scope.MenuTab = [
            {name: 'stats', visible: true},
            {name: 'perks', visible: true},
            {name: 'register', visible: !$scope.user.isRegistered()},
            {name: 'squads', visible: !$scope.user.is_guest && !$scope.quest_visible},
            {name: 'quest', visible: $scope.quest_visible},
            {name: 'action', visible: $scope.eventNum>0 && menuState<5 && !config.hideEvents},
            {name: 'skins', visible: $scope.skins_visible}];
    }

    Game.on('gameShowMenu', function(menuState) {
        if ($scope.menuState == menuState) return;
        Utils.apply($scope, function() { changeMenu(menuState) });
    })

    $scope.$on("register", chooseTab);

    function canShare() {
        if (Game.players.myId === -1) return false;
        if (!Social.postMessage) return false;

        var player = Game.players.players[Game.players.idx_ids[Game.players.myId]];
        var playersNum = Game.players.players.length;
        var pos = player.pos;

        return pos < (playersNum / 2)
    }

    $scope.commandTab = Game.appInputTab;

    $scope.commandSpace = Game.appInputBomb;

    $scope.tutor = {};

    $scope.wallPost = function(){
        var message =  localize.getString('wallpost_message_tb');
        var player = Game.players.players[Game.players.idx_ids[Game.players.myId]];
        var playersNum = Game.players.players.length;
        var pos = player.pos;
        var kills = Math.max(Math.max(Math.max(player.kills, player.kills_player), player.kills_bot), player.kills_mob);
        var skin = $rootScope.user.skin;

        message = message.replace("{x}", pos);
        message = message.replace("{y}", playersNum);

        var data = {
            userId: $rootScope.user.id,
            name: $rootScope.user.nickname,
            place: pos,
            rank: $rootScope.user.rank,
            skin: skin,
            placeText: localize.getString('place_tb')
        };
        console.log('userBoard data:', data);

        // TODO kills > 0
        if (kills > 0 || config.debugWallpost) {
            Social.postMessage(message, data, function(err, event){
                if (event && event.type === 'notification'){
                    $rootScope.messageBox(event.msg,["ok"], function(result) {});
//                    $rootScope.$broadcast('addNotification', message);
                }
            });
        }
    };

    $scope.selectPerk = function(name) {
        $scope.setActiveTab('perks');
        $scope.$broadcast('selectPerk', name);
    }

})