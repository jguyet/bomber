bombermine.factory('SocialBase', function($rootScope) {
    return {
        active: false,
        ready: false,
        onLogin: function() {},
//        postMessage: function() {},
        showRegister: function() {},
        referralLink: function() {
            return "https://gameofbombs.com/landing?referral="+$rootScope.user.id;
        },
        // showInvite: function() {}, not all network has this method
        onReady: function(err) {
            if (this.ready) {
                //may be handle error if it is here?
                return;
            }
            if (!err) {
                this.ready = true;
                $rootScope.$broadcast("socialReady")
            } else {
                $rootScope.socialError = err;
                console.log("Social init failed")
            }
        }
    }
});

var _dumbIeCallback=false;

bombermine.factory('SafariHack', function() {
    var safariCallback = null;
    var dumbIeTimeout = 0;
    function SafariHack(callback) {
        if (window.parent==window || document.cookie) {
            callback();
        } else {
            window.open("/safariFix", "login", "width=20,height=20");
            safariCallback = callback;
            if (dumbIeTimeout==0)
                dumbIeTimeout = setInterval(function() {
                    if (_dumbIeCallback) {
                        safariHack2({data: 'cookieHack'})
                    }
                }, 100);
        }
    }
    function safariHack2(event) {
        if (event.data=='cookieHack' && safariCallback) {
            safariCallback();
            safariCallback = null;
            if (dumbIeTimeout) {
                clearInterval(dumbIeTimeout);
                dumbIeTimeout = 0;
            }
        }
    }
    if (window.addEventListener){
        window.addEventListener("message", safariHack2, false);
    } else {
        window.attachEvent("onmessage", safariHack2);
    }
    return SafariHack;
});