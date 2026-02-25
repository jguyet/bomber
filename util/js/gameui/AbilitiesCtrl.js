bombermine.controller('AbilitiesCtrl', function ($scope, $rootScope, $http, ShopService, Game, storage, parseTimeFilter) {
    $scope.shopmodel = ShopService.getModel();
    
    $scope.UNIT_NONE = 0;
    $scope.UNIT_COUNT = 2;
    $scope.UNIT_ROUNDS = 3;
    $scope.UNIT_SECONDS = 4;
    
    $scope.FLAG_NO_STATS = 8;

    $scope.buyMore = function (curr) {
        if ($scope.selectedPerk && $scope.shopPerkByName[$scope.selectedPerk.name]) {
            $scope.selectedPerk.type = 'timeperks';
            $rootScope.showBuyItemModal($scope.selectedPerk, curr, 'buymore');
        }
    };

    function copy(src, dst) {
        if (src) {
            for (var key in src)
                if (src.hasOwnProperty(key))
                    dst[key] = src[key];
        }
    }

    function calcNames(a) {
        var b = {};
        for (var key in a)
            b[a[key].name] = a[key];
        return b;
    }

    $scope.backendPerks = $scope.shopmodel.timeperks;
    $scope.backendPerkByName = calcNames($scope.shopmodel.timeperks);

    $scope.shopPerks = [];
    $scope.shopPerkByName = {};
    $scope.gameData = {};
    $scope.slotsLimit = 0;
    $scope.inventoryPerks = [];
    $scope.perkByName = {}
    $scope.slots = [
        {perk: null, open: true, index: 1},
        {perk: null, open: true, index: 2},
        {perk: null, open: false, index: 3},
        {perk: null, open: false, index: 4}
    ]
    $scope.loaded = false;
    $scope.selectedPerkName = "";
    $scope.favoritePerks = null;

    $scope.getSlotStatus = function (slot) {
        if (!slot.open) return 0;
        if (!slot.perk) return 1;
        return 2;
    }

    Game.on('gamePerksChange', function (perks) {
        if (!$scope.$$phase) return $scope.$apply(function () {
            Game.emit('gamePerksChange', perks)
        })
        $scope.loaded = true;
        $scope.gameData = perks;
        $rootScope.clientCanChangePerks = 
            typeof perks.clientCanChange != "undefined" ? perks.clientCanChange
            : !perks.respawned;
        
        function ugradeFormat(p) {
            if (typeof p.unit == "undefined") {
                // upgrade data from 1.25 to 1.26
                if (p.type >= 2 && p.type <= 4) {
                    p.unit = p.type;
                    p.canActivate = true;
                    p.quantity = p.seconds + p.rounds + p.count;
                }else if (p.type == 8) {
                    p.unit = $scope.UNIT_SECONDS;
                    p.canActivate = false;
                    p.quantity = p.seconds;
                }else {
                    p.unit = $scope.UNIT_NONE;
                    p.canActivate = true; // mod perks
                }
                p.flags = 0;
                delete p.type;
                delete p.seconds;
                delete p.count;
                delete p.rounds;
            }
        }
        
        // TODO: remove
        $rootScope.respawned = perks.respawned;
        for(var i=0; i<perks.available.length; i++)
            ugradeFormat(perks.available[i]);
        for(var i=0; i<perks.active.length; i++)
            ugradeFormat(perks.active[i]);
        for(var i=0; i<perks.all.length; i++)
            ugradeFormat(perks.all[i]);
        
        $scope.slotsLimit = $rootScope.user.slots_limit;
        $scope.recalcPerks();
    })
    
    // a function to replace (p.type == 4) in the old code
    function isTimePerkAndCanActivate(p) {
        return p.type == $scope.UNIT_SECONDS && p.canActivate;
    }

    $scope.loadActivePerks = function () {
        $scope.favoritePerks = [null, null, null, null];
        for (var i = 0; i < $scope.gameData.active.length && i < 4; i++) {
            $scope.favoritePerks[i] = $scope.gameData.active[i].name;
        }
        return $scope.favoritePerks;
    }

    $scope.loadFavoritePerks = function () {
        var value = storage.getItem("game/selected_perks");
        if (value) 
            return $scope.favoritePerks = JSON.parse(value);
        else 
            return $scope.favoritePerks || [null, null, null, null];
    }

    $scope.saveFavoritePerks = function () {
        $scope.favoritePerks = [];
        for (var i = 0; i < $scope.slots.length; i++)
            $scope.favoritePerks.push($scope.slots[i].perk ? $scope.slots[i].perk.name : null);
        storage.setItem("game/selected_perks", JSON.stringify($scope.favoritePerks));
        $scope.saveSelectedPerks();
    }

    $scope.saveSelectedPerks = function () {
        Game.perksSelected = [];
        for (var i = 0; i < $scope.slots.length; i++)
            Game.perksSelected.push($scope.slots[i].perk != null ? $scope.slots[i].perk.id : -1);
    };

    $scope.$on("buySlot", function () {
        $scope.slotsLimit = $rootScope.user.slots_limit;
//      if (Game.gameIsRunning())
//        $scope.recalcPerks();
    })

    $scope.recalcPerks = function () {
        var g = $scope.gameData;
        $scope.powerupsActive = 0;
        $scope.shopPerks = []
        for (var i = 0; i < g.all.length; i++) {
            var perk = g.all[i];
            var b = $scope.backendPerkByName[perk.name];
            if (b) {
                copy(b, perk); // copy price
                $scope.shopPerks.push(perk);
                perk.canActivate = false;
            }
        }
        $scope.shopPerkByName = calcNames($scope.shopPerks);
        $scope.inventoryPerks = [];
        for (var i = 0; i < g.available.length; i++) {
            var perk = g.available[i];
            var b = $scope.shopPerkByName[perk.name];
            if (b) {
                copy(perk, b);
                if (perk.unit == $scope.UNIT_SECONDS) {
                    $scope.powerupsActive++;
                }
            } else {
                $scope.inventoryPerks.push(perk);
            }
        }
        $scope.inventoryPerkByName = calcNames($scope.inventoryPerks);

        $scope.perkByName = {}
        copy($scope.shopPerkByName, $scope.perkByName)
        copy($scope.inventoryPerkByName, $scope.perkByName)

        // load perks from client if respawned, else load from localStorage
        var fromGame = $scope.gameData.respawned;
        var p = fromGame ? $scope.loadActivePerks() : $scope.loadFavoritePerks();
        for (var i = 0; i < $scope.slots.length; i++) {
            $scope.slots[i].open = i < $scope.slotsLimit;
            $scope.slots[i].perk = null;
            if (i < $scope.slotsLimit) {
                if (p[i]) {
                    var perk = $scope.perkByName[p[i]];
                    if (perk && (fromGame || $scope.canActivatePerk(perk))) {
                        $scope.slots[i].perk = perk;
                        $scope.slots[i].perk.slotIndex = i + 1;
                    }
                }
            }
        }
        var b = $scope.selectedPerk;
        $scope.selectedPerk = (b && $scope.perkByName[b]) ? $scope.perkByName[b] : null;
        // previously there was $scope.saveSelectedPerks() here
        // now we save each change to local storage
        // so if the game adds and activates perks, it is remembered
        $scope.saveFavoritePerks();
        updateTutor();
    }

    $scope.canActivatePerk = function (perk) {
        //return perk && perk.type != 8 && perk.type != 0;
        return perk && perk.canActivate && $rootScope.clientCanChangePerks;
    }

    $scope.selectPerk = function (perk) {
        $scope.selectedPerk = perk;
        updateTutor()
    }

    $scope.getFirstFreeSlot = function () {
        for (var i = 0; i < $scope.slots.length; i++)
            if (!$scope.slots[i].perk && $scope.slots[i].open)
                return i + 1;
        return 0;
    }

    $scope.isThereLocketSlot = function () {
        for (var i = 0; i < $scope.slots.length; i++)
            if (!$scope.slots[i].open) return true;
        return false;
    };

    $scope.togglePerk = function (perk) {
        // TODO: after all the servers are unpdated, use the short if
        //if (!$rootScope.clientCanChangePerks) return;
        if (typeof $rootScope.clientCanChangePerks == "undefined") {
            // old client
            if ($rootScope.respawned) return;
        }else {
            // new client
            if (!$rootScope.clientCanChangePerks) return;
        }
        
        if (perk.slotIndex) {
            $scope.slots[perk.slotIndex - 1].perk = null;
            perk.slotIndex = 0;
            $scope.selectedPerk = null;
            $scope.saveFavoritePerks();
        } else {
            if ($scope.canActivatePerk(perk)) {
                perk.slotIndex = $scope.getFirstFreeSlot();
                if (perk.slotIndex) {
                    $scope.slots[perk.slotIndex - 1].perk = perk;
                    $scope.selectedPerk = null;
                    $scope.saveFavoritePerks();
                } else {
                    //not enough place

                    if ($scope.isThereLocketSlot()) {
                        // TODO showBuySlotModal
                        $rootScope.showBuySlot($scope.slots);
                    }

                }
            } else {
                //try buy
            }
        }
        updateTutor()
    }

    $scope.selectLockedSlot = function (index) {
        $scope.selectedPerk = { name: "slot_" + index, type: 0 }
        updateTutor()
    }

    $scope.movePerk = function (perk, slot) {
        if (!$rootScope.clientCanChangePerks) return;
        if (perk.slotIndex) {
            $scope.slots[perk.slotIndex - 1].perk = null;
            perk.slotIndex = 0;
        }
        perk.slotIndex = slot.index;
        slot.perk = perk;
        $scope.saveFavoritePerks();
        updateTutor()
    }

    $scope.clearSlots = function () {
        if (!$rootScope.clientCanChangePerks) return;
        for (var i = 0; i < $scope.slots.length; i++) {
            var perk = $scope.slots[i].perk;
            if (perk) {
                $scope.slots[i].perk = null;
                perk.slotIndex = 0;
            }
        }
        $scope.saveFavoritePerks();
    }

    $scope.slotClick = function (slot) {
        if (slot.open) {
            if (slot.perk)
                $scope.selectedPerk = slot.perk;
            else if ($scope.selectedPerk && $scope.canActivatePerk($scope.selectedPerk))
                $scope.movePerk($scope.selectedPerk, slot);
        } else {
            //try buy
        }
        updateTutor()
    }

    $scope.slotDblClick = function (slot) {
        if (slot.open) {
            if (slot.perk)
                $scope.togglePerk(slot.perk);
        } else {
            //try buy
        }
    }

    $scope.$on('tabMenuOpen', function () {
        if ($scope.menuState == 0) {
            $scope.selectedPerk = null;
        } else {
            updateTutor()
        }
    })

    $scope.$on('selectPerk', function(event, data) {
        $scope.selectedPerk = ($scope.perkByName[data]) ? $scope.perkByName[data] : null;
    })

    function updateTutor() {
        //this just cant be but it happened to user THANOS
        if (!$scope.tutor) return;
        var t = null;
        var sel = $scope.selectedPerk;
        if ($scope.menuTitle == 'help_buy_powerup') {
            //TODO: change for powerups. currently this code is for time_perk
            for (var i = 0; i < $scope.slots.length; i++)
                if ($scope.slots[i].perk != null && isTimePerkAndCanActivate($scope.slots[i].perk)) {
                    $scope.tutor['help_buy_powerup'] = "respawn";
                    return;
                }
            if (sel != null) {
                if (sel.unit == $scope.UNIT_SECONDS) {
                    if (sel.canActivate) {
                        t = "select_slot"
                        for (var i = 0; i < $scope.slots.length; i++)
                            if ($scope.slots[i].perk != null && isTimePerkAndCanActivate($scope.slots[i].perk)) {
                                t = "respawn";
                                break;
                            }
                    } else  t = "buy_more"
                } else t = "select_powerup"
            } else t = "select_powerup"
        }
        $scope.tutor['help_buy_powerup'] = t;
        console.log("current powerup buy state: " + t);
    }
    
    $scope.quantityStr = function(perk) {
        if (perk == null || perk.unit == null)
            return '';
        var s = '';
        switch(perk.unit) {
        case $scope.UNIT_NONE: s = '\u221e'; break; // infinity
        case $scope.UNIT_SECONDS: s = parseTimeFilter(perk.quantity); break;
        default: s = '' + perk.quantity; break;
        }
        if (perk.flags & $scope.FLAG_NO_STATS) s = '\u2605' + s; // star
        return s;
    }
    
})

FILTERS.filter('parseTime', function (i18nFilter) {
    return function (seconds) {
        var str = '';

        if (seconds < 60)
            str = seconds + i18nFilter("seconds_short");
        else {
            var minutes = seconds / 60 | 0;
            seconds = seconds % 60;

            if (minutes < 60) {
                str = minutes + i18nFilter("minutes_short");

                if (seconds)
                    str += ' ' + seconds + i18nFilter("seconds_short");
            } else {
                var hours = minutes / 60 | 0;
                minutes = minutes % 60;
                if (hours < 24) {
                    str = hours + i18nFilter("hours_short");

                    if (minutes)
                        str += ' ' + minutes + i18nFilter("minutes_short");
                } else {
                    var days = hours / 24 | 0;
                    hours = hours % 24;
                    str = days + i18nFilter("days_short");
                    if (hours)
                        str += ' ' + hours + i18nFilter("hours_short");
                }
            }
        }
        return str;
    }
});

FILTERS.filter('parseRelativeTime', function (parseTime, i18nFilter) {
    return function (seconds) {
        seconds -= Date.now() / 1000;
        return seconds <= 0 ? i18nFilter("expired") : parseTime(seconds);
    }
});

FILTERS.filter('parseRelativeTimeDHM', function (i18nFilter, localize) {
    return function (seconds) {
        seconds -= Date.now() / 1000;
        if (seconds <= 0) return i18nFilter("expired");
        var str = '';
        if (seconds < 60)
            str = seconds + i18nFilter("secods_short");
        else {
            var minutes = Math.ceil(seconds / 60);
            if (minutes < 60) {
                str = minutes + ' ' + localize.withCorrectEnding("minutes", minutes);
            } else {
                var hours = Math.ceil(minutes / 60);
                if (hours < 24) {
                    str = hours + ' ' + localize.withCorrectEnding("hours", hours);
                } else {
                    var days = Math.ceil(hours / 24);
                    str = days + ' ' + localize.withCorrectEnding("days", days);
                }
            }
        }
        return str;
    }
});

FILTERS.filter('parseDay', function (i18nFilter) {
    return function (day) {
        var str = '';

        if (day == 1)
            str = 'day';

        if (day > 1 && day < 5)
            str = 'day2';

        if (day > 4)
            str = 'day3';

        return str;
    }

});
