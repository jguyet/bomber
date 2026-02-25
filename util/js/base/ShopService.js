bombermine.service("ShopService", function ($http, $location, $rootScope, i18nFilter, Game, UserService) {
    var shopmodel = {};

    function setModel(model) {
        shopmodel = model;
        for (var i=0;i<model.chests.length;i++)
            if (model.chests[i].bonus_perk_amount) {
                for (var j=0; j<model.countperks.length;j++) {
                    if (model.countperks[j].name == model.chests[i].bonus_perk_name) {
                        model.chests[i].bonus_perk_count = model.chests[i].bonus_perk_amount * model.countperks[j].count;
                    }
                }
            }

        for (var key in model)
            if (model.hasOwnProperty(key)) {
                if (model[key] instanceof Array) {
                    for (var i = 0; i < model[key].length; i++)
                        model[key][i].type = key;
                } else {
                    var m2 = model[key];
                    for (var key2 in m2)
                        if (m2.hasOwnProperty(key2)) {
                            m2[key2].type = key;
                        }
                }
            }
        return model;
    }

    setModel($rootScope.config.shopModel)

    function updateModel(cb) {
        if (!cb) cb = function () {
        };
        if (shopmodel.length == 0) {
            shopmodel = $rootScope.config.shopModel;
        }
        $http.get("/api/v3/shopmodel")
            .success(function (data) {
                setModel(data);
                cb(null, shopmodel);
            })
            .error(function () {
                cb('Error!')
            })
    };

    var getModel = function () {
        return shopmodel;
    };

    var buyItemSrv = function (item, currency, hud, cb) {
        if (!cb) cb = function () {
        };

        function myCb(err, data) {
            if (!err) {
                $rootScope.user.plutonium = data.plutonium;
                $rootScope.user.gold = data.gold;
                switch (item.type) {
                    case "chests":
                    case "timeperks":
                        UserService.updateCurrentUser();
                        break;
                    case "slots":
                        $rootScope.user.slots_limit = item.slotNumber;
                        $rootScope.$broadcast("buyslot");
                        break;
                }
                Game.appInputRejoin();
            }else
                console.log("Server error: " + err);
            cb(err, data)
        }

        switch (item.type) {
            case 'chests':
                buyChest({hud: hud, name: item.name, currency: currency}, myCb);
                break;
            case 'timeperks':
                buyTimePerk({hud: hud, name: item.name, hours: 1, currency: currency}, myCb);
                break;
            case 'slots':
                buySlot({hud: hud, slotNumber: item.slotNumber, currency: currency}, myCb);
                break;
            case 'skin_pack':
                buySkinPack({hud: hud, name: item.name, currency: currency}, myCb);
                break;
            case 'skins':
                buySkin({hud: hud, name: item.name,
                    price: item.price, currency: currency, days: item.days, mode: item.mode}, myCb);
                break;
        }
    };


    function buyChest(data, cb) {
        query("/api/v3/buyChest", data, function (err, data) {

            if (err) return cb(err);

            var perks = [], i, j, p;

            for (i = 0; i < data.timeperks.length; i++) {
                p = data.timeperks[i];
                for (j = 0; j < p.amount; j++) {
                    perks.push({name: p.name});
                }
            }

            for (i = 0; i < data.roundperks.length; i++) {
                p = data.roundperks[i];
                for (j = 0; j < p.amount; j++) {
                    perks.push({name: p.name});
                }
            }

            for (i = 0; i < data.countperks.length; i++) {
                p = data.countperks[i];
                for (j = 0; j < p.amount; j++) {
                    perks.push({name: p.name});
                }
            }

            cb(null, {
                notification: {
                    title: i18nFilter("open_chest"),
                    text: i18nFilter("your_randomed_perks"),
                    perks: perks,
                    type: "success"
                },
                plutonium: data.plutonium,
                gold: data.gold
            });
        });
    }

    function buyTimePerk(data, cb) {
        var id = data.name;

        query("/api/v3/buyTimePerk", data, function (err, data) {
            if (err) return cb(err);
            cb(null, {
                notification: {
                    title: i18nFilter("time_added"),
                    text: i18nFilter("you_ve_bought_1_hour") + " '" + id + "'",
                    type: "success"
                },
                plutonium: data.plutonium,
                gold: data.gold
            });
        });
    }

    function buySlot(data, cb) {
        query("/api/v3/buyAdditionalSlot", data, function (err, data) {
            if (err) return cb(err);
            cb(null, {
                notification: {
                    title: i18nFilter("slot_unlocked"),
                    text: i18nFilter("you_can_use_new_slot"),
                    type: "success"
                },
                slots_limit: data.slotsLimit,
                plutonium: data.plutonium,
                gold: data.gold
            });
        });
    }

    function buySkinPack(data, cb) {
        query("/api/v3/buySkinPack", data, function (err, data) {
            if (err) return cb(err);
            cb(null, {
                notification: {
                    title: i18nFilter("buy_Megapack2"),
                    text: i18nFilter("you_can_use_new_skins"),
                    type: "success"
                },
                plutonium: data.plutonium,
                gold: data.gold
            });
        });
    }

    function buySkin(data, cb) {
        query("/api/v3/buySkin", data, function (err, data) {

            if (err) return cb(err);

            cb(null, {
                notification: {
                    title: i18nFilter("buy_Megapack2"),
                    text: i18nFilter("you_can_use_new_skins"),
                    type: "success"
                },
                plutonium: data.plutonium,
                gold: data.gold
            });
        });
    }

    function query(url, data, cb) {
        $http.post(url, data)
            .success(function (data) {
                cb(null, data);
            })
            .error(function (err, status) {
//          console.log('error', arguments);
                if (status == 0)
                    cb('server_no_connection')
                else if (status >= 500)
                    cb("server_error")
                else
                    cb(err);
            });
    }

    return {
        getModel: getModel,
        buyItemSrv: buyItemSrv,
        updateModel: updateModel
    }
});

