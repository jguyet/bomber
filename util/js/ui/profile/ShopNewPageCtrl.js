bombermine.controller('ShopNewPageCtrl', function($http, $scope, $rootScope, i18nFilter, UserService, ShopService) {
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
    
    $scope.activeTab = "simple";//"advanced";
    $scope.ulTab = [
        {name: "buy_now", active: "simple" == $scope.activeTab, route: "simple"},
        {name: "basic_shop", active: "basic" == $scope.activeTab, route: "basic"},
        {name: "advanced_shop", active: "advanced" == $scope.activeTab, route: "advanced"}
    ];

    $scope.curlevel = {
        "bombs1": 0,
        "power1": 1,
        "money1": 2,
        "scate1": 1,
        "atomic1": 2,
        "atomic2": 3,
        "battle1": 2
    }
    $scope.upg = {
        "bombs1": 2,
        "power1": 1,
        "money1": 2,
        "scate1": 1,
        "atomic1": 2,
        "atomic2": 3,
        "battle1": 2
    };

    $scope.curLevel = function(perk) {
        return $scope.curlevel[perk.name] || 0;
    }

    $scope.setCurLevel = function(perk, num) {
        $scope.curlevel[perk.name] = num;
    }

    $scope.isUpgrade = function(perk) {
        return ($scope.curlevel[perk.name] > $scope.upg[perk.name]);
    }

    $scope.upgradePrice = function(perk) {
        return perk.levels[$scope.curlevel[perk.name]].upgrade_price;
    }

    $scope.goldPrice = function(perk) {
        return perk.levels[$scope.curlevel[perk.name]].gold_price;
    }

    $scope.plutPrice = function(perk) {
        return perk.levels[$scope.curlevel[perk.name]].price;
    }

    $scope.basicShop = [
        {"name":"bombs1", "type":"timeperks", time: 100,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":3000, "upgrade_price": 1}
            ]},
        {"name":"power1", "type":"timeperks", time: 1000,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":4000, "upgrade_price": 1}
            ]},
        {"name":"money1", "type":"timeperks", time: 60000,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":3000, "upgrade_price": 1}
            ]},
        {"name":"scate1", "type":"timeperks", time: 24*600,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":3000, "upgrade_price": 1}
            ]},
        {"name":"atomic1", "type":"timeperks", time: 11000,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":3000, "upgrade_price": 1}
            ]},
        {"name":"atomic2", "type":"timeperks", time: 1960,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":3000, "upgrade_price": 1},
                {name: '4', "price":4,"gold_price":4000, "upgrade_price": 1}
            ]},
        {"name":"battle1", "type":"timeperks", time: 800,
            levels: [
                {name: '1', "price":1,"gold_price":1000, "upgrade_price": 1},
                {name: '2', "price":2,"gold_price":2000, "upgrade_price": 1},
                {name: '3', "price":3,"gold_price":3000, "upgrade_price": 1}
            ]}
    ];

    $scope.go = function(route) {
        $scope.activeTab = route;
        for (var i = 0; i < $scope.ulTab.length; i++) {
            //console.log($scope.ulTab.route);
            if ($scope.ulTab[i].route == route) {
                $scope.ulTab[i].active = true;
                //console.log('1');
            }
            else {
                $scope.ulTab[i].active = false;
                //console.log('2');
            }
        }
    }

    $scope.advancedShop = [
        {
            name: "advanced boots 1",
            things: [
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"immune","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"starter","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autojetpack","price":3,"gold_price":0,"type":"timeperks"}
            ]
        },
        {
            name: "advanced boots 2",
            things: [
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"premium","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"immune","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"premium","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"immune","price":3,"gold_price":0,"type":"timeperks"}
            ]
        },
        {
            name: "advanced boots 3",
            things: [
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"premium","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"immune","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"starter","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autojetpack","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"premium","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"immune","price":3,"gold_price":0,"type":"timeperks"},
            ]
        },
        {
            name: "advanced boots advanced boots",
            things: [
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"autoshield","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"premium","price":3,"gold_price":0,"type":"timeperks"},
                {"name":"immune","price":3,"gold_price":0,"type":"timeperks"}
            ]
        },
    ];

    $scope.simpleShop = [
        {"name":"autoshield", "type":"timeperks", day: 1, "price":5,"gold_price":100000},
        {"name":"premium", "type":"timeperks", day: 2, "price":4,"gold_price":90000},
        {"name":"immune", "type":"timeperks", day: 3, "price":2,"gold_price":50000},
        {"name":"starter", "type":"timeperks", day: 1, "price":12,"gold_price":1500000},
        {"name":"autojetpack", "type":"timeperks", day: 9, "price":6,"gold_price":400000},
        {"name":"premium", "type":"timeperks", day: 3, "price":4,"gold_price":350000}
    ];
    
    $scope.elemSelectSimpleShop = $scope.simpleShop[0];
    $scope.getNameSimpleShop = function() {
        return $scope.elemSelectSimpleShop["name"];
    };
    $scope.getPriceSimpleShop = function() {
        return $scope.elemSelectSimpleShop["price"] || 0;
    };
    $scope.getGoldPriceSimpleShop = function() {
        return $scope.elemSelectSimpleShop["gold_price"] || 0;
    };
    $scope.getDaySimpleShop = function() {
        return $scope.elemSelectSimpleShop["day"] || 0;
    };

    $scope.selectElemSimpleShop = function(index) {
        var index = index || 0;
        $scope.elemSelectSimpleShop = $scope.simpleShop[index];
    };
});