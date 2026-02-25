//var bombermine = angular.module('bombermine', ['ngRoute', 'filters', 'localization']);

bombermine.config(function($httpProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
});

bombermine.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.deferIntercept();
}])

bombermine.config(['ngClipProvider', function(ngClipProvider) {
  ngClipProvider.setPath("/js/lib/ZeroClipboard.swf");
}])


.run(function($rootScope, $urlRouter, $state, community) {
  $rootScope.$on('$locationChangeSuccess', function(evt, newUrl, oldUrl) {
    // Halt state change from even starting
    evt.preventDefault();


    if (newUrl.indexOf('/#/forum/') === -1 || $state.current.name !== 'forum') {
      $urlRouter.sync();
    } else {

      if (newUrl.split('/#/forum/')[1].length === 0) {

        var $iframe = $('#community_iframe');

        if ($iframe.length == 1) {
          community.post({
            type: 'goHome'
          });
//          console.log('iframe location: ', $iframe[0].src);
        }
//        console.log('home');
      }
    }
  });

  $urlRouter.listen();
});

