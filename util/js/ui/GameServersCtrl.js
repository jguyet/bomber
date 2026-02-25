function secToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}

bombermine.controller('GameServersCtrl', function ($scope, $rootScope, $location, Game, serverList, Tracking) {
    function afterUpdate() {
        angular.extend($scope, serverList)
        sort()
        if (!$scope.$$phase)
            $scope.$digest()
    }

    function afterInit() {
        var rooms = serverList.rooms, servers = serverList.servers;
        var ss = $scope.sortedServers = []
        for (var id in servers) if (servers.hasOwnProperty(id)) {
            ss.push(servers[id])
        }
        var sr = $scope.sortedRooms = []
        for (var id in rooms) if (rooms.hasOwnProperty(id)) {
            sr.push(rooms[id])
        }
        sort()
    }


    function sort() {
        var ss = $scope.sortedServers, sr = $scope.sortedRooms;
        ss.sort(function(a, b) {
            var la = a.status.latency, lb = b.status.latency;
            if (la=="-") la = 100000;
            if (lb=="-") lb = 100000;
            return la-lb;
        });
        var sid = {};
        for (var i=0;i<ss.length;i++)
            sid[ss[i].id] = i;
        sr.sort(function(a, b) {
            var s = sid[a.serverId] - sid[b.serverId];
            if (s!=0) return s;
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        })
    }

    $scope.getServerIconPosition = function (type, value) {
        var x, y;
        y = 0;
        switch (type) {
            case 'players':
                x = 0;
                y = Math.floor(value / 100);
                if (y > 3)
                    y = 3;
                break;
            case 'timeLeft':
                value = 16 - parseInt(value);
                if (value < 0)
                    value = 0;
                x = 1;
                y = Math.ceil(value / 2);
                break;
            case 'latency':
                x = 2;
                y = 0;
                var l = 64;
                while (l < value) {
                    l *= 2;
                    y++;
                }
                break;
        }
        return { 'background-position': -(x * 16) + 'px ' + -(y * 16) + 'px' };
    };

    $scope.selectServer = function(srv) {
        var current = serverList.current
        var mem = {serverId: current.serverId, roomId: current.roomId};
        current.serverId = srv.id;
        current.roomId = 0;
        $rootScope.reconnectTimer = 0;
        serverList.autoSelect();
        if (serverList.tryConnect())
            $rootScope.showMenu = false;
        else {
            current.serverId = mem.serverId;
            current.roomId = mem.roomId;
        }
    }

    $scope.selectRoom = function(room, track_key) {
        //TODO: move it to serverList or what?
        var current = serverList.current
        var mem = {serverId: current.serverId, roomId: current.roomId};

        current.serverId = room.serverId;
        current.roomId = room.id;
        $rootScope.reconnectTimer = 0;
        serverList.autoSelect();
        if (serverList.tryConnect()) {
            $rootScope.showMenu = false;
            if (track_key) Tracking.track(track_key, serverList.current.roomId);
        }
        else {
            current.serverId = mem.serverId;
            current.roomId = mem.roomId;
        }
    }
    
    /*$scope.roomIdOld = serverList.current.roomId;
    $scope.rememberRoom = function() {
        for (var i = 0; i < serverList.activeServer().rooms.length; i++) {
            if (serverList.activeServer().rooms[i]['id'] == $scope.roomIdOld) {
                $scope.selectRoom(serverList.activeServer().rooms[i])
                return;
            }
        }
    }*/

    afterInit();
    afterUpdate();
    $scope.idlePing();
    $scope.$on("serversUpdate", afterUpdate);
    $scope.$on("serversInit", afterInit);

    var path = window.location.hash.replace("#/servers/", '');
    $scope.$on("serversPing", function() {
        if (!$scope.searchOptimal) return;
        serverList.current.serverId = 0;
        serverList.current.roomId = 0;
        $scope.searchOptimal = false;
        $location.path("/servers/")
        $rootScope.play()
    });
    if (path.substring(0, 4)=="init") {
        $scope.searchOptimal = true;
    }
    $scope.$on("$destroy", function() {
        $scope.searchOptimal = false;
    })
});