bombermine.controller('ShopPageCtrl', function($http, $scope, $rootScope, i18nFilter, UserService, ShopService) {
    $scope.slotsLimit = $rootScope.user.slots_limit;

    $scope.isSlotAllowed = function(slotId) {
        if (slotId == 'third_slot') {
            return $scope.slotsLimit == 2
        } else if (slotId == 'fourth_slot') {
            return $scope.slotsLimit == 3
        } else return false
    }

    $scope.perkTime = function(perkName) {
        var user = $rootScope.user;
        for (var i=0;i<user.perks.length; i++)
            if (user.perks[i].name==perkName && user.perks[i].unit == 4)
                return user.perks[i].quantity;
        return 0;
    }
});
