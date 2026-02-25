bombermine.controller('ScoreboardCtrl', function($location, $scope, $rootScope, $http, localize, Social, Keys, Game, $element) {
  $scope.playerCount = 0;
  $scope.pageCount = 0;
  $scope.currentPage = 0;
  $scope.pageSize = 100;
  $scope.listSize = 14;
  $scope.listPlayers = [];
  $scope.filtered = 0;
  $scope.filterVal = "";

  var LINE_HEIGHT = 30;
  var SCROLLL_MIN_HEIGHT = 40;

  var $board = $element;
  var $wrap = $board.find('#list-wrap');
  var $scrollbar = $wrap.find('#list-scrollbar');
  var $thumb = $scrollbar.find('#list-thumb');

  var filtered;

  var sortInterval, redrawDelay;

  var scrollTopMax, scrollPosition;

  var focusOnPlayer, focusIndex;

  var ticking;

  $scrollbar.on('mousedown', function(event) {
    scrollPosition = event.pageY - $wrap.offset().top - ($thumb.height() / 2);

    setScrollBounds();

    requestTick();

    redrawScores();

    $(document).bind('mousemove', startDrag);
    $(document).bind('mouseup', endDrag);

    event.preventDefault();
    event.stopPropagation();
  });

  if (window.addEventListener) {
    $wrap[0].addEventListener('DOMMouseScroll', wheel, false);
    $wrap[0].addEventListener('mousewheel', wheel, false);
  } else
    $wrap[0].onmousewheel = wheel;

  function wheel(e) {
    var event = e || window.event;

    var delta = event.wheelDelta
      ? event.wheelDelta / 120
      : -event.detail / 3;

    scrollPosition -= delta * 8;

    setScrollBounds();
    updateScrollPosition();
    redrawScores();

    event.stopPropagation();
    event.preventDefault();
  }

  function getPageDelta() {
    var players = $scope.filtered > 0
      ? $scope.filtered
      : $scope.playerCount;
    return Math.min(players - ($scope.currentPage * $scope.pageSize), $scope.pageSize);
  }

  function redrawScroll() {
    if (getPageDelta() <= $scope.listSize) {
      scrollPosition = 0;
      $thumb.hide();
    } else
      $thumb.show();

    var scrollHeight = $scope.listSize * LINE_HEIGHT;
    $scope.hScroll = scrollHeight;
    var thumbHeight = Math.floor(scrollHeight * ($scope.listSize / getPageDelta())) - 2;//2px на верхний отступ
    $thumb.height(thumbHeight < SCROLLL_MIN_HEIGHT ? SCROLLL_MIN_HEIGHT : thumbHeight);

    scrollTopMax = scrollHeight - $thumb.height();

    setScrollBounds();
    updateScrollPosition();
  }

  function setPageData() {
    $scope.filtered = filtered.length;

    $scope.playerCount = $scope.filterVal
      ? $scope.filtered
      : Game.players.players.length;
    
    /*смена количества игроков*/
    if ($scope.playerCount > $scope.pageSize) {
      $scope.listSize = 13;
    }
    else {
      $scope.listSize = 14;
    }
    if ($scope.listSize != $scope.listPlayers.length) {
        $scope.listPlayers = [];
        for (var i = $scope.listSize; i--;)
            $scope.listPlayers.push(new Object);
    }
    $scope.pageCount = Math.ceil($scope.playerCount / $scope.pageSize);
    if ($scope.pageCount == 0)
      $scope.currentPage = 0;
    setScrollBounds();
  }

  function redrawScores() {

    if (!$scope.$$phase) return $scope.$apply(redrawScores)
    
    var fval = $scope.filterVal
    var filter = fval
      ? fval.toLowerCase()
      : null;

    $scope.hasFlags = Game.hasFlags();
    // update filtered list
    filtered = !filter
      ? []
      : Game.players.players.filter(function(player) {
      return ~player.nickname.toLowerCase().indexOf(filter);
    });
    //console.log(Game.players.players);
    // check phase
    !$scope.$$phase
      ? $scope.$apply(setPageData)
      : setPageData();

    focusIndex = Game.players.idx_ids[focusOnPlayer] || 0;//20;
    var pageScroll = $scope.currentPage * $scope.pageSize;
    var linesOn = $scope.listSize;

    // remove line if focused on the player that is not on the current page
    if ((focusIndex < pageScroll) || (focusIndex > pageScroll + $scope.pageSize))
      linesOn--;

    // get offset from the scroll position
    var offset = getPageDelta() > linesOn
      ? Math.floor((getPageDelta() - linesOn) * (parseInt($thumb.css('top')) / ($scrollbar.height() - $thumb.height())))
      : 0;

    var startIndex = pageScroll + offset;
    var lastIndex = $scope.listSize - 1;
    var startIndChange = false;
    // iterate through the players in the list
    for (var i = 0, index, player, $li; i < $scope.listSize; i++) {
      
      index = startIndex + i;
      if (!filter && i == 0 && focusIndex < startIndex) {
        index = focusIndex;
        if (offset == 0) {
          startIndex--;//+1 игрок
          $scope.listSize--;
        }
      }

      if (!filter && i == lastIndex && focusIndex > startIndex + lastIndex) {
          index = focusIndex;
      }

      player = !filter
        ? Game.players.players[index]
        : filtered[index];

      var $player = $scope.listPlayers[i];

      $player.empty = !player || (filtered.length && !filtered[i]);
      
      if (!$player.empty) {
        $player.highlighted = player.id == focusOnPlayer
        $player.observing = player.status == 2;
        $player.place = !$player.empty ? index + 1 : '';
        $player.pos = player.pos;
        $player.plut = player.plutonium;
        $player.nickname = player.nickname || '';
        $player.deaths = player.deaths !== undefined ? player.deaths : '';
        $player.kills = player.kills !== undefined ? player.kills : '';
        $player.team_capture = player.team_capture !== undefined ? player.team_capture : '';
        $player.rank = player.rank || 0;
        $player.medal = player.medal || 0;

      } else
        $scope.listPlayers[i] = { empty: true };

    }

    if ($scope.pageCount <= $scope.currentPage && $scope.pageCount != 0)
      $scope.currentPage = $scope.pageCount - 1;

    clearTimeout(redrawDelay);
    redrawDelay = null;

    redrawScroll();
  }

  $scope.getRankStyle = function(index) {
    return { 'background-position': '0px ' + -(index * 16) + 'px' };
  }
  function sortPlayers() {
      if ($scope.hasFlags) {
          Game.players.players.sort(function (a, b) {
              return (a.team_capture * 1e6) +  (a.kills * 1e3) - (a.deaths / 1e3) - (a.id / 1e6) < (b.team_capture * 1e6) + (b.kills * 1e3) - (b.deaths / 1e3) - (b.id / 1e6) ? 1 : -1;
          });
      } else {
          Game.players.players.sort(function (a, b) {
              return (a.kills * 1e3) - (a.deaths / 1e3) - (a.id / 1e6) < (b.kills * 1e3) - (b.deaths / 1e3) - (b.id / 1e6) ? 1 : -1;
          });
      }

    Game.players.updateIndex();

    redrawScroll();
  }
  /*function sortPlayers() {
      Game.players.players.sort(function(a, b) {
      return (a.kills * 1e3) - (a.deaths / 1e3) - (a.id / 1e6) < (b.kills * 1e3) - (b.deaths / 1e3) - (b.id / 1e6) ? 1 : -1;
    });

      Game.players.updateIndex();

    redrawScroll();
  }*/

  Game.players.onSort = function () {
    if ($scope.menuState == 0) return;
    redrawScores();
  }

  $scope.$watch(function () {
    return $scope.currentPage;
  }, function(value) {
    scrollPosition = 0;
    redrawScroll();
    redrawScores();
  });

  $scope.$on('tabMenuOpen', function() {
    if ($scope.menuState == 0) {
      clearInterval(sortInterval);
      //$board.unbind('mousedown', noop);
      return;
    }
    sortPlayers();
    focusOnPlayer = Game.appObserverWatchingPlayer()
    //$filter.val('');//обнуление поиска
    if (focusOnPlayer === -1)
      focusOnPlayer = Game.players.myId;
    focusIndex = Game.players.idx_ids[focusOnPlayer] || 0;
    $scope.currentPage = focusIndex && $scope.menuState != 4 ? Math.floor(focusIndex / $scope.pageSize) : 0;
    var focusDelta = focusIndex - ($scope.currentPage * $scope.pageSize);
    scrollPosition = $scope.menuState != 4 ? Math.floor((focusDelta / getPageDelta()) * ($scrollbar.height() - $thumb.height())) : 0;
    updateScrollPosition();
    redrawScores();
    clearInterval(sortInterval);
    var interval = $scope.menuState != 4 ? 5000 : 1000;
    sortInterval = setInterval(function () {
      sortPlayers()
      redrawScores();
    }, interval)
    //$board.bind('mousedown', noop);
  })

  $scrollbar.on('mousedown', function(event) {
    $(document).bind('mousemove', startDrag);
    $(document).bind('mouseup', endDrag);

    event.preventDefault();
    event.stopPropagation();
  });

  function startDrag(event) {
    scrollPosition = event.pageY - $wrap.offset().top - ($thumb.height() / 2);

    setScrollBounds();

    requestTick();

    event.preventDefault();
    event.stopPropagation();
  }

  function endDrag(event) {
    $(document).unbind('mousemove', startDrag);
    $(document).unbind('mouseup', endDrag);

    event.stopPropagation();
  }

  function setScrollBounds() {
    scrollPosition = scrollPosition < 0
      ? 0
      : scrollPosition;

    scrollPosition = scrollPosition > scrollTopMax
      ? scrollTopMax
      : scrollPosition;
  }

  function requestTick() {
    if (!ticking) {
      window.rAF(updateScrollPosition);
      ticking = true;
    }

    if (!redrawDelay)
      redrawDelay = setTimeout(redrawScores, 50);
  }

  function updateScrollPosition() {
    $thumb.css('top', scrollPosition);

    ticking = false;
  }

  function noop(event) {
    event.stopPropagation();
  }

  window.rAF = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame
  }) ();

  $scope.ObservePlayer = function(nickname) {
    Game.appObserverWatchPlayer(nickname);
    //event.stopPropagation();
  }


    $scope.filterFocus = function() {
        Keys.lock("score_search");
    }
    $scope.filterBlur = function() {
        Keys.unlock("score_search");
    }
    $scope.filterKeyDown = function(event) {
        if ((event.keyCode || event.which) == 27)
            redrawScores();
    }
    var nicknameFilterTimeout;
    $scope.$watch("filterVal", function(newVal, oldVal) {
        if (newVal == '')
            return redrawScores();
        if (nicknameFilterTimeout || newVal.length < 2)
            return;
        nicknameFilterTimeout = setTimeout(function () {
            redrawScores();
            setPageData();
            clearTimeout(nicknameFilterTimeout);
            nicknameFilterTimeout = null;
        }, 200);
    });
})