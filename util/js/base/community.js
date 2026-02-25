    /**
 * Created by Liza on 29.08.2014.
 */
bombermine.service("community", function($rootScope, $location, $state) {
    var msg = null;
    var iframe = null;

    // postMessage handler from community

    if (window.addEventListener){
      window.addEventListener("message", postMessage, false);
    } else {
      window.attachEvent("onmessage", postMessage);
    }

    function postMessage(event){
      if (event.data == "process-tick") return;

      if (event.data && event.data.type === 'routeDone'){
        var path = '/forum/' + event.data.url;

        if (decodeURIComponent(window.location.hash) !== '#' + path){
//          console.log('change state: ', window.location.hash, ' to ', path);

          $rootScope.$apply(function(){
            var query, queryIndex = path.indexOf('?');

            if (queryIndex !== -1) {
              query = path.slice(queryIndex+1);
              path = path.slice(0, queryIndex);

              console.log('queryIndex', path, query);
              $location.path(path).search(query).replace();
            } else {
              $location.path(path).search({}).replace();
            }


          });
//
//          $location.replace();
//
//          $state.go('forum', {path: event.data.url});
//          $state.transitionTo ('forum', {path: event.data.url}, { location: false, inherit: true, relative: $state.$current, notify: true })
//          if(history.pushState) {
//            history.pushState(null, null, '#' + path);
//          } else {
//            location.hash = '#' + path;
//          }
        }
      }
    }

    function doTheJob() {
        msg && iframe && iframe.contentWindow.postMessage(msg, '*');
        msg = null;
    }

    return {
        attach: function(element) {
            iframe = element;
            doTheJob();
        },
        detach: function() {
            iframe = null;
        },
        post: function(msg0) {
            msg = msg0;
            doTheJob();
        },
        open: function(msg0) {
            msg = msg0;
            $rootScope.showMenu = true;
            $location.path("/forum/");
            doTheJob();
        }
    }

});
