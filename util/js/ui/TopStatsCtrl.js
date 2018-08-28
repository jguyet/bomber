bombermine.controller('TopStatsCtrl', function($scope, $rootScope, $http, UserService, $location, serverList, $sce, i18nFilter) {
    var FLAG_INACTIVE = 1;
    var countryNames = {'RU':'RU', 'EU':'EU', 'US':'US', 'BR':'BR'};
    $scope.PERIODS = [
        {id: 'alltime'},
        {id: '30days', showFilters: true}, 
        {id: 'month_t', name: 'month', info: 'month_t_desc', hideSorts: true, showMonthly: true},
        {id: 'month_l', name: 'month', info: 'month_l_desc', hideSorts: true, showMonthly: true},
        {id: '7days', showFilters: true},
        {id: 'yesterday', showFilters: true},
        {id: 'today', showFilters: true},
        {id: 'tournaments', hideSorts: true}
    ];
    $scope.FILTERS = ['all', 'RU', 'EU', 'US', 'BR', 'JP', 'classic', 'pvm', 'team'];
	$scope.MONTHLY = [
		{id: 'lastMonth'},
		{id: 'thisMonth'}
	]
    $scope.SORTS = {
        'all':     ['score', 'kills', 'money', 'medals', 'team', 'killsMob'],
        'classic': ['kills', 'score', 'medals', 'money'],
        'pvm':     ['killsMob', 'score', 'money'],
        'team':    ['team', 'score', 'kills', 'money']
    };
    $scope.period   = $scope.PERIODS[1];
    $scope.filter   = $scope.FILTERS[0];
    $scope.sorts    = $scope.SORTS.all;
    $scope.sort     = $scope.sorts[0];
	$scope.monthly  = $scope.MONTHLY[1];
    $scope.busy     = false;
    // to restore last sort that was used before forcibly changing it with filter
    var lastCustomSorts = null;
    var srv = serverList.activeServer();
    if (srv && $scope.FILTERS.indexOf(srv.country.toUpperCase()) > 0) {
        $scope.filter = srv.country.toUpperCase();
    }
        
    $scope.currentPage = 0;
    $scope.pageSize = 25;
    $scope.pagesTotal = 0;
    $scope.playersTotal = 0;
    $scope.data = [];
    
    $scope.tours = [];
    $scope.tour = {};
    function updateTours() {
        $http.get('/api/v3/stat/tournaments?limit=5').success(function(json) {
            $scope.tours = json.list;
            var updatedTour = {};
            for(var i=0; i<$scope.tours.length; i++) {
                var t = $scope.tours[i];
                t.ends = new Date(t.starts + t.duration * 1000);
                t.starts = new Date(t.starts);
                t.minutes = Math.floor(t.duration / 60);
                t.room = t.room || i18nFilter('rankings_all');
                t.sortKey = t.sortKey || $scope.SORTS.all[0];
                t.sortName = i18nFilter('rankings_' + t.sortKey);
                t.countryName = countryNames[t.countryName] || i18nFilter('rankings_' + t.countryName);
                t.mapName = i18nFilter('rankings_' + t.mapName);
                if (!config.hideReferralLinks)
                    t.info = t.infoWithURL || t.info;
                if (t.info) t.info = $sce.trustAsHtml(t.info)
                if ($scope.tour.id == t.id)
                    updatedTour = t;
            }
            $scope.tour = updatedTour;
        })
    }
    updateTours();
    
    $scope.getPeriodStatus = function() {
        var t = $scope.tour;
        if (!t.starts) return 0;
        var now = Date.now()
        if (now < t.starts) return 0;
        if (now > t.ends) return 3;
        return (t.periodFlags & FLAG_INACTIVE) ? 1 : 2;
    }
    
    function setPeriod(value) {
        $scope.period = value;
        $scope.tour = {};
        switch(value.id) {
        case 'alltime':
            $scope.sorts = $scope.SORTS.all;
            $scope.currentPage = 0;
            requestStatistics();
            break;
        case 'tournaments':
            updateTours();
        	setTour($scope.tours[0]);
            break;
        case 'month_t':
        case 'month_l':
            $scope.sort = 'money';
        	setFilter('BR');
            break;
        default:
            setFilter($scope.filter);
        }
    }
    
    $scope.clickPeriod = function(value) {
        if (!$scope.busy && $scope.period != value) setPeriod(value);
    }
    
    function setTour(value) {
        $scope.tour = value;
        $scope.sort = $scope.tour.sortKey;
        $scope.currentPage = 0;
        requestStatistics();
    }

    $scope.clickTour = function(value) {
        if (!$scope.busy && $scope.tour != value) setTour(value);
    }
    
    function setFilter(value) {
        $scope.sorts = $scope.SORTS[value] || $scope.SORTS.all;
        if ($scope.sorts.indexOf($scope.sort) < 0 ||
             $scope.sorts != $scope.SORTS.all && $scope.sorts != lastCustomSorts) {
            $scope.sort = $scope.sorts[0];
        }
        if ($scope.sorts != $scope.SORTS.all)
            lastCustomSorts = $scope.sorts;
        $scope.filter = value;
        $scope.currentPage = 0;
        requestStatistics();
    }
    
    $scope.clickFilter = function(value) {
        if (!$scope.busy && $scope.filter != value) setFilter(value);
    }
    
    function setSort(value) {
        $scope.sort = value;
        $scope.currentPage = 0;
        requestStatistics();
    }
    
    $scope.clickSort = function(value) {
        if (!$scope.busy && $scope.sort != value) setSort(value);
    }
	
    function setMonthly(value) {
        $scope.monthly = value;
        $scope.currentPage = 0;
        requestStatistics();
    }
	
    $scope.clickMonthly = function(value) {
        if (!$scope.busy && $scope.monthly != value) setMonthly(value);
    }
	
	$scope.getSkinThumbSrc = function(skin) {
		return '/api/ctor/getskin?name='+encodeURIComponent(skin || 'default')+'&thumb=1';
	}

    function requestStatistics() {
        var moreParams = '';
        var from = $scope.currentPage * $scope.pageSize;
        var period = $scope.period.id;
        if (period == 'month_t') {
            moreParams += '&providerId=tibia';
        }else if (period == 'month_l') {
            moreParams += '&providerId=lol';
        }
		if ($scope.period.showMonthly) period = $scope.monthly.id
        var path = '/api/v3/stat/top'
            + '?period=' + period
            + '&filter=' + ($scope.tour.id || $scope.filter)
            + '&sort=' + $scope.sort
            + '&from=' + from
            + '&count=' + $scope.pageSize
            + moreParams;
        
        $scope.busy = true;
        $http.get(path).success(function(json) {
            $scope.data = json.data;
            
            //dont show tibia to users who arent mods or have no tibia account
            //var hideTiba = ($rootScope.user.perm_mask&2)==0 && $rootScope.user.identities.indexOf("tibia")<0

            function createRow(ar, place) {
            	var obj = { place: place };
                for (var i=0; i<json.keys.length; i++)
                    obj[json.keys[i]] = ar[i];
                // so far we have only tibia, so we know that pid is from tibia
                // if we have another provider in the future, we'll add providerid field
                //if (hideTiba) obj.pid = false;
                return obj;
            }
            
            // convert arrays of values to objects
            for (var i=0; i<$scope.data.length; i++) {
                $scope.data[i] = createRow($scope.data[i], i + json.from);
            }

            $scope.playersTotal = json.total;
            $scope.pagesTotal = Math.ceil($scope.playersTotal / $scope.pageSize);

            if (json.me) {
                var me = createRow(json.me, json.myIndex);
                if (me.place > from + $scope.pageSize)
                    $scope.data.push(me)
                else if (me.place < from)
                    $scope.data.unshift(me);
            }
            $scope.busy = false;
        }).error(function(json) {
        	$scope.data = [];
            $scope.busy = false;
       	});
    }

    $scope.getTibiaLink = function(tibia) {
        return $sce.trustAsResourceUrl('https://secure.tibia.com/community/?subtopic=characters&name='+encodeURIComponent(tibia));
    }

    $scope.filterName = function(s) {
        return countryNames[s] || i18nFilter('rankings_' + s);
    }

    $scope.$watch(function () {
        return $scope.currentPage;
    }, function(value) {
        requestStatistics();
    });
 
});
