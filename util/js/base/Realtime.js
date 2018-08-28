/**
 * Created by Liza on 05.07.2015.
 */

bombermine.service('Realtime', function($rootScope, $q) {
    //NO TTL :(

    var socket = null;

    // reduce query frequencey if server fails
    var TRY_AFTER_MIN = 5000;
    var TRY_AFTER_MAX = 5000; // no reduction currently
    var tryAfter = TRY_AFTER_MIN;

    function randomUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

    function onopen() {
        realtime.events.emit("connected", "yay");
    }

    function onclose(evt) {
        for (var key in byUUID)
            if (byUUID.hasOwnProperty(key)) {
                byUUID[key].reject("server_no_connection");
            }
        byUUID = {};
        socket = null;
        //TODO: logout user if auth expired somehow, or user was banned
        window.setTimeout(createSocket, tryAfter);
        tryAfter = Math.min(tryAfter + 1000, TRY_AFTER_MAX);
    }

    function createSocket() {
        var ws = new WebSocket((location.protocol=="https:"?"wss:":"ws:") + "//"+location.host+"/api/v3/user/ws?token="+$rootScope.user.token);
        ws.onopen = onopen;
        ws.onclose = onclose;
        ws.onmessage = onmessage;
        socket = ws;
    }

    var byUUID = {};
    var ttl = 5;

    function onmessage(event) {
        var msg = JSON.parse(event.data);
        if (msg.backendAuthError) {
            console.log("backend auth error: "+msg.backendAuthError);
            return;
        }
        tryAfter = TRY_AFTER_MIN;
        if (byUUID.hasOwnProperty(msg.uuid)) {
            if (msg.error) byUUID[msg.uuid].reject(msg.error);
            else byUUID[msg.uuid].resolve(msg.data);
            delete byUUID[msg.uuid];
        } else {
            realtime.events.emit(msg.method, msg);
        }
    }

    var realtime = {
        onLogin: createSocket,
        getReadyState: function() {
            if (ws==null) return 3;
            return ws.readyState;
        },
        ask: function(method, data) {
            var deferred = $q.defer();
            if (socket ==null || socket.readyState!=1) {
                deferred.reject("server_no_connection");
                return deferred.promise;
            }
            var msg = { uuid: randomUUID(), method: method, data: data };
            socket.send(JSON.stringify(msg));
            byUUID[msg.uuid] = deferred;
            return deferred.promise;
        },
        send: function(method, data) {
            var msg = { uuid: randomUUID(), method: method, data: data };
            if (socket != null && socket.readyState == 1) socket.send(JSON.stringify(msg));
        },
        events: new EventEmitter()
    };

    return realtime;
});