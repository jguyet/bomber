bombermine.service("Keys", function($http, $location, $rootScope, Game) {
    var lock = 0, keys = 0;
    var locks = {}

    function keyLock(name) {
        if (!name) name = "default"
        if (!locks[name])
            lock++;
        locks[name] = 1;
        keys = 0;
    }

    function keyUnlock(name) {
        if (!name) name = "default"
        if (locks[name])
            lock--;
        locks[name] = 0;
    }

    function keyUp(key) {
        var keys2 = (keys & ~key);
        if (keys2 != keys) {
            keys = keys2;
            Game.appInputKeys(keys);
        }
    }

    function keyDown(key) {
        var keys2 = (keys | key);
        if (keys2 != keys) {
            keys = keys2;
            if (serv.listener)
                serv.listener(keys);
            Game.appInputKeys(keys);
        }
    }

    function lockOnTrue(scope, variable, name) {
        if (scope[variable])
            keyLock(name)
        scope.$watch(variable, function(newValue, oldValue) {
            if (newValue) keyLock(name);
            else keyUnlock(name);
        })
        scope.$on('$destroy', function() {
            if (scope[variable]) keyUnlock(name)
        })
    }
    var serv = $rootScope.Keys = {
        lock: keyLock,
        unlock: keyUnlock,
        keyUp: keyUp,
        keyDown: keyDown,
        isLocked: function() {return lock!=0;},
        lockOnTrue: lockOnTrue,
        listener: null
    }
    return serv;
});
