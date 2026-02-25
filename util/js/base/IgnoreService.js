bombermine.service("IgnoreService", function ($http, $rootScope, Realtime) {
    var ids = {}, recIds = {};
    
    Realtime.events.on("chatIgnore", function(msg) {
        if (msg.data) {
            if (msg.data.addedRecId)
                recIds[msg.data.addedRecId] = true;
            if (msg.data.removedRecId)
                delete recIds[msg.data.removedRecId];
        }
    });

    function reloadIds(cb) {
        cb = cb || function(){};
        $http.get("/api/v3/chat/getIgnoreIds").success(function(data, status, headers) {
            console.log("IGNORE DATA: ")
            console.log(data)
            ids = {};
            for(var i=0; i<data.ids.length; i++)
                ids[data.ids[i]] = true;
            recIds = {}
            for(var i=0; i<data.recIds.length; i++)
                recIds[data.recIds[i]] = true;            
            cb();
        }).error(function (err) {
            cb(err);
        });
    }
    
    function add(troll_id, troll_name, hours, cb) {
        cb = cb || function(){};
        var req = {troll_id:troll_id, troll_name:troll_name, hours:hours};
        $http.post('/api/v3/chat/addIgnore', req).success(function() {
            ids[troll_id] = true;
            cb();
        }).error(function (err) {
            cb(err);
        });
    }
    
    function remove(troll_id, cb) {
        cb = cb || function(){};
        $http.post('/api/v3/chat/removeIgnore', {troll_id:troll_id}).success(function() {
            delete ids[troll_id];
            cb();
        }).error(function (err) {
            cb(err);
        });
    }    

    reloadIds();
    
    return {
        isIgnored: function(userId) { return ids[userId] || recIds[userId]; },
        isIgnoredByMe: function(userId) { return ids[userId]; },
        add: add,
        remove: remove
    }
});