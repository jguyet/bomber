bombermine.controller('StartCtrl', function ($scope, $rootScope, $location, Game, serverList, Tracking, Social) {
    function afterInit() {
        var servers = serverList.servers;
        //do something
        $scope.servers = [];
        for (var id in servers) if (servers.hasOwnProperty(id)) {
            $scope.servers.push(servers[id])
        }
    }

    if (config.defaultRoom) {
        $location.path("/");
    }

    function afterUpdate() {
        selectBest();
        if (!$scope.$$phase)
            $scope.$digest()
    }

    $scope.servers = [];

    $scope.selectedServer = null;
    $scope.selectedRoom = null;
    $scope.bestServer = null;
    $scope.rooms = ["hardcore", "tutorial"];
    $scope.selReg = true;

    $scope.next = function(srv) {
        if ($scope.selectedServer == null) return;
        Tracking.track("start_region", $scope.selectedServer.id);
        Tracking.settings("region", $scope.selectedServer.id);
        $scope.selReg = false;
    }

    $scope.selectServ = function(server) {
        $scope.selectedServer = server;
    };

    $scope.selectRoom = function(mode) {
        $scope.selectedRoom = mode;
    }

    function selectBest() {
        var ss = [];
        if ($scope.servers.length==0) return;
        for (var i=0;i<$scope.servers.length;i++) {
            ss.push($scope.servers[i]);
        }
        ss.sort(function(a, b) {
            var la = a.status.latency, lb = b.status.latency;
            if (la=="-") la = 100000;
            if (lb=="-") lb = 100000;
            return la-lb;
        });
        $scope.bestServer = ss[0];
    }

    $scope.playGameFirstTime = function() {
        if ($scope.selectedServer==null) return;//cant do that.

        Tracking.track("start_room", $scope.selectedRoom);

        serverList.current.serverId = $scope.selectedServer.id;
        serverList.current.roomId = serverList.findRoomId($scope.selectedServer.id, $scope.selectedRoom);
        $rootScope.reconnectTimer = 0;
        serverList.firstConnection = true;
        if (serverList.tryConnect()) {
            Tracking.track("start_connecting", serverList.current.roomId);
            $location.path("/profile/");
            $rootScope.showMenu = false;
        }
        //send info to GA and database
        //remember the region too
    }

    $scope.onlineTotal = function() {
        return serverList.onlineTotal;
    }
    $scope.doPing = serverList.doPing;

    afterInit();
    afterUpdate();
    serverList.idlePing();
    $scope.$on("serversUpdate", afterUpdate);
    $scope.$on("serversInit", afterInit);

    $scope.videoHardcore = $('#video-starthardcore');
    $scope.videoTutorial = $('#video-starttutorial');
    function videoPlay(video) {
        video[0].play();
        var isChrome = !!window.chrome;
        video.bind("ended", function() {
            if (isChrome) {
                this.load();
            }
            this.play();
        });
    };

    if (config.defaultServer) {
        for (var i=0;i<$scope.servers.length;i++) {
            if ($scope.servers[i].id == Social.defaultServer)
            $scope.selectedServer = $scope.servers[i];
            $scope.next();
            break;
        }
    }
    videoPlay($scope.videoHardcore);
    videoPlay($scope.videoTutorial);
});