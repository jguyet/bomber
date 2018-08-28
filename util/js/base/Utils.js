
Utils = {
    // scrolling
    getElementRelativePos: function(element, containerElement) {
        var res = {
            x: -containerElement.offsetLeft,
            y: -containerElement.offsetTop
        };
        containerElement = containerElement.offsetParent;
        while (element != containerElement) {
            res.x += element.offsetLeft;
            res.y += element.offsetTop;
            element = element.offsetParent;
            if (element == null) // it happens when it's hidden
                return null;
        }
        return res;
    },
    scroll: function($scope, element, scrollTop) {
        if (element)
            Utils.outOfPhase($scope, function() {
                element.scrollTop = scrollTop;
            });
    },
    
    // waiting until something is initialized
    repeatUntilTrue: function(cb, interval, maxTime) {
        interval = interval || 50;
        maxTime = maxTime || 20000;
        function waiter() {
            if (!cb() && maxTime > 0) {
                maxTime -= interval;
                setTimeout(waiter, interval);
            }
        }
        waiter();
    },
    // accepts functions and ids of elements, single or array
    whenExist: function(things, cb) {
        if (typeof things != "object" || !things.__proto__.push)
            things = [things];
        Utils.repeatUntilTrue(function() {
            var res = [];
            for(var i=0; i<things.length; i++) {
                var v = typeof things[i] == "string"
                    ? document.getElementById(things[i])
                    : things[i]();
                if (!v)
                    return false;
                res.push(v);
            }
            cb.apply(window, res);
            return true;
        });
    },
    
    // angularJS phases
    apply: function($scope, cb) {
        $scope.$$phase ? cb() :	$scope.$apply(cb)
    },
    digest: function($scope) {
        if (!$scope.$$phase) $scope.$digest();
    },
    outOfPhase: function($scope, cb) {
        Utils.repeatUntilTrue(function() {
            return !$scope.$$phase && (cb() || true);
        }, 15);
    },
    inNextPhase: function($scope, cb) {
        Utils.outOfPhase($scope, function() {
            Utils.apply($scope, cb);
        });
    },
    
    randomElement: function(arr) {
        return arr.length ? arr[(Math.random() * arr.length) | 0] : null;
    },
    
    // text functions
    
    // returns false if email has a valid format or error message
    validateEmail: function(email) {
        var pattern = /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/i;
        if (email=="") return "email_must_not_be_empty";
        if (!pattern.test(email)) return "incorrect_email";
        return false;
    }
}