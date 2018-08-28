/**
 * Created by Liza on 29.08.2014.
 */
bombermine.service("serverList", function($rootScope, Game, storage, Realtime) {
    var ROOM_FLAG_ACCESS_ONLY_HOME = 1;
    
    window.game = Game; // a hack to get the Game object in the console (could be in any module, why not here...)

    var hosts = {};
    var initialized = false;
    var pingReady = true;

    // ======================= current server and room ========================
    var current = {
        serverId : 0,
        roomId : 0,
        ssl : false,
        roomType: 0 // helps select a room with the same type as previous
    };
    function acceptAndSaveCurrent() {
        var room = serverList.rooms[current.roomId];
        if (room)
            current.roomType = room.roomType;
        storage.setItem('game/' + config.auth + '/currentServer', JSON.stringify(current));
    }
    function loadCurrent() {
        var s = storage.getItem('game/' + config.auth + '/currentServer');
        if (s) {
            try {
                serverList.current = current = JSON.parse(s);
            } catch (e) {
                // we never save here. Looks like legacy code. Maybe reove it?
                s = storage.getItem('game/currentServer');
                if (s) {
                    try {
                        serverList.current = current = JSON.parse(s);
                    } catch (e) {
                        //nothing
                    }
                }
            }
        }
    }
    function dropWrongCurrent() {
        if (!initialized) return;
        var room = activeRoom();
        if (room) {
            if (room.serverId != current.serverId) {
                // we know that this server exists and it has this room
                current.serverId = room.serverId;
                // select a room that is not down
                current.roomId = findRoomId(current.serverId, room.roomType);
            }
            // we have both room and server
        }else {
            current.roomId = 0;
            if (!activeServer()) 
                current.serverId = 0;
            // we have no room; we may have a server
        }
    }

    // =========================== helper classes =============================
    function Server() { 
        this.status = new Status(); 
        this.players = 0 
    }
    function Room(srvId) { 
        this.status = new Status(); 
        this.roomType = "hardcore"; 
        this.serverId = srvId;
    }
    function Host(server, domain) { 
        this.status = new Status();
        this.server = server;
        this.domain = domain;
        this.rooms = [];
    }
    function Status(latency) {
        this.pinged = false;
        this.latency = latency || "-";
        this.players = 0;
        this.ssl = (location.protocol == "https:");
    }

    //================================ Pinging ================================

    function pingServer(host, times, cb, debug) {
        var cb2 = function(msg, res) {
            if (msg == null) {
                res.ssl = false;
                cb(msg, res);
            }
            else
                pingServer_internal(host, true, times, cb1, debug);
        };
        var cb1 = function(msg, res) {
            if (msg == null) {
                res.ssl = true
            }
            cb(msg, res);
        };
        if (location.protocol == "https:") {
            pingServer_internal(host, true, times, cb1, debug);
        }
        else
            pingServer_internal(host, false, times, cb2, debug);
    }

    function pingServer_internal(host, ssl, times, cb, debug) {
        times = times || 10;
        var pings = [];
        if (ssl && host.substring(host.length-5, host.length)==":8080")
            host = host.substring(0, host.length-5) +":8443";
        var s = new WebSocket((ssl?"wss:":"ws:") + "//" + host);
        var started = Date.now();
        debug && console.log('fn started (0 ms):', started);

        s.onmessage = function(msg) {
            if (!s) return;
            var res = JSON.parse(msg.data);
            if (res.pingtest) {
                for (var i=0; i<times; i++) {
                    (function(i) {
                        setTimeout(function() {
                            ping(i)
                        }, i * 10);
                    })(i);
                }
                return;
            }
            var timestamp = msg.timeStamp;
            // to counter a chrome bug (?) since March 2016 - strange small float number in timestamp
            if (timestamp < 1450000000000) timestamp = Date.now();
            
            if (timestamp>=10000000000000) timestamp = timestamp/1000;
            var latency = timestamp - res.time;
            if(--times) {
                pings.push(latency);
                // ping();
            } else {
                if(debug) {
                    console.log('fn ended:', (Date.now() - started) + ' ms');
                    console.log('pings:', pings);
                    console.log('latency (median):', median(pings)|0);
                    console.log('server response:', res);
                }
                //IE fix
                s.closed = true;
                s.close(1000);
                if(cb && cb instanceof Function) {
                    return cb(null, angular.extend(new Status(median(pings)|0), res));
                }
            }
        };

        s.onclose = function() {
            debug && console.log('ws onclose:', (Date.now() - started) + ' ms');
            if(!pings.length && !s.error) {
                cb('ws no results');
            }
            s = null;
        };

        s.onopen = function() {
            debug && console.log('ws onopen:', (Date.now() - started) + ' ms');
            s.send(JSON.stringify({pingtest: Date.now()}));
        };

        s.onerror = function(err) {
            if (!s || s.closed) return;
            debug && console.log('ws err', err);
            s.error = true;
            return cb('ws onerror');
        };

        function ping(i) {
            s.send(JSON.stringify({time: Date.now()}));
            debug && console.log('sent msg #' + i + ':', (Date.now() - started) + ' ms');
        }

        function median(values) {
            values.sort( function(a,b) {return a - b;} );
            var half = Math.floor(values.length/2);
            if(values.length % 2)
                return values[half];
            else
                return (values[half-1] + values[half]) / 2.0;
        }
    }

    // these vars are used only inside doPing()
    var hostsToPing = {};
    var pingTimeout = 0, lastPingTime = 0;
    var hostsCounter = 0;

    function doPing() {
        if (pingTimeout) {
            window.clearTimeout(pingTimeout)
        }
        lastPingTime=Date.now();
        var servers = serverList.servers;
        pingTimeout = window.setTimeout(doPingReady, 15000);
        pingReady = false;
        serverList.onlineTotal = 0;
        var newHostsToPing = {};
        for (var id in servers) if (servers.hasOwnProperty(id)) {
            servers[id].pinged = false;
        }
        hostsCounter = 0;
        for (var domain in hosts) if (hosts.hasOwnProperty(domain)) {
            newHostsToPing[domain] = 1;
            if (hostsToPing[domain]) continue;
            hostsCounter++;
            (function(host) {
                pingServer(host.domain, null, function (err, result) {
                    hostsToPing[host.domain] = 0;
                    var srv = host.server;
                    if (!srv.pinged) {
                        srv.status.players = 0;
                        srv.status.latency = "-";
                        srv.pinged = true;
                        srv.down = true
                    }
                    if (!err) {
                        var timeleft = result.timeLeft / 10 | 0;
                        result.timeLeft = timeleft >= 0
                            ? secToHms(timeleft)
                            : '00:00';
                        if (result.rooms) {
                            var players = 0;
                            for (var i=0; i< result.rooms.length; i++) {
                                players += result.rooms[i].players;
                            }
                            result.players = players;
                        }
                        angular.extend(host.status, result);
                        serverList.onlineTotal += host.status.players || 0;
                        srv.status.players += host.status.players || 0;
                        if (srv.status.latency == "-" ||
                            srv.status.latency > host.status.latency)
                            srv.status.latency = host.status.latency;
                        host.down = false;
                        srv.down = false
                    } else {
                        host.down = true;
                        host.status = new Status();
                    }
                    for (var i=0; i<host.rooms.length; i++) {
                        var room = host.rooms[i];
                        room.status = {}
                        angular.extend(room.status, host.status);
                        if (result && result.rooms) {
                            var sr = result.rooms;
                            for (var j = 0; j < sr.length; j++)
                                if (sr[j].id == host.rooms[i].id) {
                                    var timeleft = sr[j].timeLeft / 10 | 0;
                                    sr[j].timeLeft = timeleft >= 0
                                        ? secToHms(timeleft)
                                        : '00:00';
                                    angular.extend(room.status, sr[j]);
                                }
                        }
                        room.down = host.down;
                    }
                    hostsCounter--;
                    if (hostsCounter == 0)
                        doPingReady();
                    dropWrongCurrent()
                    $rootScope.$broadcast("serversUpdate");
                });
            })(hosts[domain]);
        }
        hostsToPing = newHostsToPing
    }

    function doPingReady() {
        if (!pingReady) {
            pingReady = true;
            $rootScope.$broadcast("serversPing")
        }
    }

    function idlePing() {
        if (!lastPingTime || lastPingTime+300*1000<Date.now()) {
            doPing()
        }
    }
    window.setInterval(idlePing, 60*1000);

    function nearestServer() {
        var nearest = null;
        var latency = 100000;
        var servers = serverList.servers;
        for (var id in servers) if (servers.hasOwnProperty(id)) {
            var srv = servers[id];
            if (srv.status.latency!="-" && srv.status.latency < latency && selectGoodRoomId(id)) {
                latency = srv.status.latency;
                nearest = srv
            }
        }
        return nearest;
    }

    function checkIfTutor() {
        var roomId = current.roomId;
        if (roomId && serverList.rooms[roomId] && serverList.rooms[roomId].roomType=="tutorial" && $rootScope.tutorLevel()>0)
            changeCurrentRoomId(0);
    }

    function init(srvs) {
        var servers = serverList.servers || {};
        var newServers = {};
        var rooms = serverList.rooms || {};
        var newRooms = {};

        hosts = {};
        var perms = $rootScope.user ? $rootScope.user.perm_mask : 0;
        for (var i = 0; i < srvs.length; i++) {
            var srv = srvs[i];
            if (!srv.access ||
                (perms&98)==98 ||
                (perms&4)==4 ||
                (perms&2)==2 ||
                srv.access.indexOf("all")>=0 ||
                srv.access.indexOf("dev")>=0 && (perms&18)!=0 ||
                srv.access.indexOf(config.auth)>=0) {
                var server = servers[srv.id] || new Server();
                angular.extend(server, srv);
                newServers[server.id] = server;
                for (var j = 0; j < server.rooms.length; j++) {
                    var room = rooms[server.rooms[j].id] || new Room(server.id);
                    server.rooms[j] = angular.extend(room, server.rooms[j]);
                    newRooms[room.id] = room;
                    room.name = room.name || room.roomType;
                    
                    // TODO: remove after "sandbox" is removed from scala config
                    if (room.roomType == "sandbox") room.roomType == "pvm";

                    if (!hosts[room.domain])
                        hosts[room.domain] = new Host(server, room.domain);
                    hosts[room.domain].rooms.push(room)
                }
            }
        }
        serverList.rooms = newRooms;
        serverList.servers = newServers;
        initialized = true;
        $rootScope.$broadcast("serversInit")

        dropWrongCurrent();
    }

    function doAfterInit(callback) {
        if (initialized) callback();
        else {
            var c = $rootScope.$on("serversInit", function() {
                c();
                callback();
            });
        }
    }
    // if roomType is undefined, finds a good playable room (or room in current domain that is down) or 0
    // if roomType = false, finds any playable room or 0
    // if roomType, finds a room with this roomType or 0
    function findRoomId(serverId, roomType) {
        var srv = serverList.servers[serverId];
        if (typeof roomType == 'undefined') {
            return selectGoodRoomId(serverId);
        }
        for (var i = 0; i < srv.rooms.length; i++) {
            var room = srv.rooms[i];
            if (!room.down && !room.cantPlayReason)
                if (roomType === false || room.roomType == roomType)
                    return srv.rooms[i].id
        }
        return 0;
    }

    // selects the best fitting playable room of a server
    // uses the same room as previous or similar (if possible)
    function selectGoodRoomId(serverId) {
        var MIN_PRIO = -999999;
        var MAX_PRIO = 999999;
        var rooms = serverList.servers[serverId].rooms;
        var curDomain = $rootScope.connectionStatus == 1 ? current.domain : '';
        var variants = [];
        var curPrio = MIN_PRIO;
        var lastRoomType = current.roomType || activeRoom() && activeRoom().roomType;
        for (var i=0; i<rooms.length; i++) {
            var room = rooms[i];
            // if we can play
            if (!room.cantPlayReason && (!room.down || room.domain == curDomain) ) {
                if (room.id == current.roomId)
                    return room.id; // it's our previous room - look no further!
                var roomPrio = room.priority;
                if (room.id == config.defaultRoom) {
                    // lower than unfinished tutorial, but higher than anything else
                    roomPrio = MAX_PRIO / 2;
                } else switch(room.roomType) {
                    case "tutorial":
                        roomPrio = $rootScope.tutorLevel() > 0 ? MIN_PRIO : MAX_PRIO;
                        break;
                    case "sandbox":
                    case "pvm":
                        // send newbies to mosnters;
                        // send pros away from monsters;
                        // don't adjust if a level is intermediate
                        if ($rootScope.user.rank < 3) roomPrio += 5;
                        else if ($rootScope.user.rank > 4) roomPrio -= 5;                        
                        break;
                }
                // try to use the same roomType as before
                // unless we should avoid this room (like finished tutorial)
                if (room.roomType == lastRoomType && roomPrio > MIN_PRIO) {
                    roomPrio = MAX_PRIO;
                } 
                // add to variants
                if (curPrio < roomPrio) {
                    variants = [room];
                    curPrio = roomPrio;
                }else if (curPrio == roomPrio) {
                    variants.push(room);
                }
            }
        }
        var room = Utils.randomElement(variants);
        return room ? room.id : 0;
    }

    function autoSelect() {
        dropWrongCurrent();
        var srv = activeServer();
        if (!srv) {
            srv = nearestServer();
            if (!srv) return false;
            current.serverId = srv.id
        }
        if (!current.roomId || serverList.rooms[current.roomId].cantPlayReason) {
            current.roomId = selectGoodRoomId(current.serverId);
            if (!current.roomId)
                srv.down = true;
        }
    }

    function onChangeRoom(room0) {
        if (!room0 || current.roomId==room0.id) return;
        var room = serverList.rooms[room0.id];
        if (room) {
            current.roomId = room.id;
            current.serverId = room.serverId;
            var ssl = hosts[room.domain].status.ssl;
            var host = room.domain;
            if (ssl && host.substring(host.length-5, host.length)==":8080")
                host = host.substring(0, host.length-5) +":8443";
            $rootScope.config.SERVER_ADDRESS = (ssl?"wss:":"ws:")+"//"+host+"/?room="+room.id
        }
    }

    function tryConnect() {
        dropWrongCurrent();
        if (current.roomId == 0)
            return false;
        var room = serverList.rooms[current.roomId];
        var ssl = hosts[room.domain]?hosts[room.domain].status.ssl: (location.protocol=="https:");
        current.ssl = ssl;
        var host = room.domain;
        if (ssl && host.substring(host.length-5, host.length)==":8080")
            host = host.substring(0, host.length-5) +":8443";
        var serverAddress = (ssl?"wss:":"ws:")+"//"+host+"/?room="+room.id;
        current.domain = room.domain;
        acceptAndSaveCurrent();
        if ($rootScope.config.SERVER_ADDRESS == serverAddress) {
            if ($rootScope.connectionStatus == 1)
                return true;
        } else {
            $rootScope.config.SERVER_ADDRESS = serverAddress
        }
        Game.emit('gameEventNetDisconnect', 200);
        return true;
    }

    function activeServer() {
        return serverList.servers[current.serverId]
    };

    function activeRoom() {
        return serverList.rooms[current.roomId]
    };

    function failsafe(attempt_number) {
        var roomId = serverList.current.roomId;
        var serverAddress = $rootScope.config.SERVER_ADDRESS;
        var domain = serverList.current.domain;
        Realtime.ask("conn_fail", {roomId: roomId, url: serverAddress, domain: domain, attempt: attempt_number}).then(
            function(data) {
                if (data.code == 1) {
                    //change domain
                    if (serverList.rooms[data.roomId]) {
                        serverList.rooms[data.roomId].domain = data.domain;
                        tryConnect();
                    }
                    else {
                        //WTF? room is removed? do nothing
                    }
                } else {
                    //i dont know what to do, keep trying
                }
            }, function() {
                //we are totally offline. do nothing, keep trying
            }
        )
    }

    var serverList = {
        rooms : {},
        servers: {},
        doPing : doPing,
        init : init,
        autoSelect: autoSelect,
        tryConnect: tryConnect,
        current: current,
        isPingReady: function() {
            return pingReady
        },
        activeServer: activeServer,
        activeRoom: activeRoom,
        findRoomId: findRoomId,
        idlePing: idlePing,
        checkIfTutor: checkIfTutor,
        onChangeRoom: onChangeRoom,
        doAfterInit: doAfterInit,
        failsafe: failsafe
    };
    loadCurrent();
    return serverList;
});