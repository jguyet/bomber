bombermine.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/");
  $urlRouterProvider.deferIntercept();

  $stateProvider
      .state('profile', {
        url: "/",
        templateUrl: 'tmpl/profile.tmpl'
      })
      .state("money", { abstract: true, url:"/money", templateUrl:"tmpl/money.tmpl" })
        .state("money.buy_now", { 
            url: "/buy_now", 
            templateUrl: "tmpl/money/buy_pluto_or_register_inner.tmpl"
         })
        .state("money.goal", { url: "/goal", templateUrl: "tmpl/money/goal.tmpl" })

      .state('character', {
        url: "/character/",
        templateUrl: 'tmpl/profile/character.tmpl'
      })
//      .state('wiki', {
//        url: "/wiki/",
//        templateUrl: "tmpl/wiki.tmpl"
//      })
//      .state('wikiPage', {
//        url: "/wiki/*path",
//        templateUrl: "tmpl/wiki.tmpl"
//      })

      .state('servers', {
        url: "/servers/*path",
        templateUrl: 'tmpl/servers.tmpl'
      })
      .state('start', {
          url: "/start/",
          templateUrl: 'tmpl/start.tmpl'
      })
      .state('modal', {
        url: "/modal/",
        templateUrl: 'tmpl/modal.tmpl'
      })
      .state('shop', {
        url: "/shop/",
        templateUrl: 'tmpl/shop.tmpl'
      })
      .state('shopnew', {
        url: "/shopnew/",
        templateUrl: 'tmpl/shopnew.tmpl'
      })
      .state('settings', {
        url: "/settings/",
        templateUrl: 'tmpl/settings.tmpl'
      })
//      .state('skins', {
//          url: "/skins/:tab",
//          templateUrl: 'tmpl/skins.tmpl'
//      })
      .state("skins", { abstract: true, url:"/skins", templateUrl:"tmpl/skins.tmpl" })
        .state("skins.skins",     { url: "/skins", templateUrl: "tmpl/skins/skins.tmpl" })
        .state("skins.character", { url: "/character", templateUrl: "tmpl/skins/character.tmpl" })

      .state('achievements', {
        url: "/achievements/",
        templateUrl: 'tmpl/achievements.tmpl'
      })
      .state('rankingsOld', {
        url: "/rankingsOld/",
        templateUrl: 'tmpl/rankings.tmpl',
        controller: 'RankingsPageCtrl'
      })
      .state('rankings', {
        url: "/rankings/",
        templateUrl: 'tmpl/top_stats.tmpl',
        controller: 'TopStatsCtrl'
      })
      .state('play', {
          url: "/play/",
          templateUrl: 'tmpl/profile.tmpl',
          onEnter: function(){

          }
      })
      .state('forum', {
        url: "/forum/*path",
        templateUrl: 'tmpl/community.tmpl',
        onEnter: function(){
          console.log('forum enter', arguments);
        },
        onExit: function(){
          console.log('forum exit', arguments);
        }
      })
      .state('referrals', {
        url: "/referrals/",
        templateUrl: 'tmpl/referrals.tmpl'
      })
      .state('password', {
        url: "/recover-password/",
        templateUrl: 'tmpl/recover-password.tmpl'
      });
    var s = $stateProvider.state("wiki", { abstract: true, url:"/wiki", templateUrl:"tmpl/wiki.tmpl" });
    //TODO: вынести это в отдельный сервис для вики, как и список таб, он в WikiCtrl
    var wikiLangs = ["en", "ru", "jp", "es", "fr", "pt-BR", "de"];
    for (var i=0;i<wikiLangs.length;i++) {
        var lc = wikiLangs[i];
        s = s.state("wiki."+lc+"credits",  { url: "/"+lc+"/credits", templateUrl: "tmpl/wiki/"+lc+"/credits.tmpl" })
            .state("wiki."+lc+"faq",  { url: "/"+lc+"/faq", templateUrl: "tmpl/wiki/"+lc+"/faq.tmpl" })
            .state("wiki."+lc+"howToPlay", { url: "/"+lc+"/how-to-play", templateUrl: "tmpl/wiki/"+lc+"/how-to-play.tmpl" })
            .state("wiki."+lc+"troubleshooting", { url: "/"+lc+"/troubleshooting", templateUrl: "tmpl/wiki/"+lc+"/problems.tmpl" })
            .state("wiki."+lc+"referrals", { url: "/"+lc+"/referrals", templateUrl: "tmpl/wiki/"+lc+"/referrals.tmpl" })
            .state("wiki."+lc+"services", { url: "/"+lc+"/services", templateUrl: "tmpl/wiki/"+lc+"/services.tmpl" })
    }

//  $routeProvider.when('/', {
//        templateUrl: iframe('mainpage')
//    }).when('/profile/', {
//        templateUrl: 'tmpl/profile.tmpl'
//    }).when('/money/', {
//        templateUrl: iframe('money')
//    }).when('/character/', {
//        templateUrl: 'tmpl/profile/character.tmpl'
//    }).when('/wiki/', {
//        templateUrl: function(params) {
//            return "tmpl/wiki.tmpl";
//        }
//    }).when('/wiki/:locale/:page', {
//        templateUrl: function(params) {
//            return "tmpl/wiki.tmpl";
//        }
//    }).when('/servers/', {
//        templateUrl: 'tmpl/servers.tmpl'
//    }).when('/modal/', {
//        templateUrl: 'tmpl/modal.tmpl'
//    }).when('/shop/', {
//        templateUrl: 'tmpl/shop.tmpl'
//    }).when('/skins/', {
//        templateUrl: 'tmpl/skins.tmpl'
//    }).when('/achievements/', {
//        templateUrl: 'tmpl/achievements.tmpl'
//    }).when('/rankings/', {
//        templateUrl: 'tmpl/rankings.tmpl',
//        controller: 'RankingsPageCtrl'
//    }).when('/forum/:one?/:two?/:three?', {
//        templateUrl: 'tmpl/community.tmpl'
//    }).when('/referrals/', {
//        templateUrl: 'tmpl/referrals.tmpl'
//    }).when('/recover-password/', {
//        templateUrl: 'tmpl/recover-password.tmpl'
//    }).otherwise({
//        redirectTo: '/'
//    });

    /*
     .when('/play/', {
     templateUrl: iframe('play'),
     controller: 'PlayPageCtrl'
     })
     */

}]);
