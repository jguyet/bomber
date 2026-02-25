/**
 * Created by Liza on 29.08.2014.
 */
bombermine.controller('CommunityCtrl', function($scope, $rootScope, community, serverList) {
    var iframe = $("#community_iframe")[0];
    iframe.onload = function() {
        iframe.style.visibility='visible';
        community.attach(iframe);
    };

    var path = window.location.hash.replace("#/forum/", '');
    function setParam(path, s) {
        if (path.indexOf(s) === -1) {
            if (path.indexOf('?') === -1) {
                path += '?'+s
            } else {
                path += '&'+s
            }
        }
        return path
    }
    path = setParam(path, "iframe=1")
    if (config.auth)
        path = setParam(path, "auth="+config.auth)
    var protocol = (location.protocol=="https:" || serverList.current.ssl) ? "https:" : "http:";
    iframe.src = protocol+"//gameofbombs.com/community/"+ path;
    $scope.$on("$destroy", community.detach);
});
