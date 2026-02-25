bombermine.service("skinModel", function ($http, $location, $rootScope, i18nFilter, Game, UserService) {
    var skinsAllowed = [];
    var curSkin = $rootScope.user.skin || "default";

    var ctorBaseDir = "/ctor/";
    var freeCtorSkins = [
        {type:"B", skin_code:"!BAQAC6vCqtPbsLgKLVB8=", saved:-1},
        {type:"B", skin_code:"!BAQAAADusqtqsdhdZ1xWEAFikEg==", saved:-1},
        {type:"B", skin_code:"!BAQAAjk9wPB7bXWRdVxAC6g==", saved:-1}
    ];

    var skinModel = {
        groups: { list: [] },
        shopList: [],
        byName: {},
        ctorThumbStyles: {},
        ctorConfigs: {},
        ownsSkin: false,
        ownsCtorSkin: false,
        my: {},
        checkSkin: function() {
            curSkin = $rootScope.user.skin || "default";
            skinModel.activeSkin = skinModel.getSkinByName(curSkin);
            skinModel.activeSkin.active = true;
            skinModel.my[ curSkin ] = 1;
        },
        getSkinByName: function(name) {
            for(var i=0; i<skinModel.groups.list.length; i++) {
                var skins = skinModel.groups.list[i].skins;
                for(var j=0; j<skins.length; j++) {
                    if (skins[j].name == name) {
                        return skins[j];
                    }
                }
            }
            return skinModel.activeSkin = {
                group: {name: "all"},
                id: sprites._dynamic[name] ? sprites._dynamic[name].index : 0,
                name: name,
                active: true
            };
        },
        getActiveSkin: function() {
            curSkin = $rootScope.user.skin || "default";
            if (skinModel.activeSkin.name != curSkin)
                skinModel.checkSkin();
            return skinModel.activeSkin;
        },
        activateSkin: function(skin, cb) {
            var name = skin.name;
            if (name == curSkin) {
                if (cb) cb();
                return;
            }
            function onSuccess() {
                skinModel.activeSkin = skin;
                $rootScope.user.skin = curSkin = name;
                Game.appInputRejoin();
                if (cb) cb();
            }
            if (name[0] == "!") {
                $http.post('/api/ctor/set_or_buy', {
                    code: name,
                    cost: Costs.zero()
                }).success(onSuccess);
            }else
                $http.post('/api/v2/change-skin/', { skin: name }).success(onSuccess);
        },
        saveOrRemoveSkin: function(skin, cb) {
            if (skin.name[0] != "!")
                throw "saveRemoveSkin - non constructor skin";
            $http.post('/api/ctor/manage_saved', {
                skin_code: skin.name,
                saved: !skin.saved
            }).success(function() {
                if (skin.saved) {
                    var mySkins = skinModel.groups.list[0];
                    delete mySkins.byName[skin.name];
                    for(var i=0; i<mySkins.skins.length; i++) {
                        if (mySkins.skins[i].name == skin.name) {
                            mySkins.skins.splice(i, 1);
                            break;
                        }
                    }
                    if (skin.name == skinModel.activeSkin.name)
                        skinModel.activateSkin(mySkins.skins[0], cb);
                }else {
                    skin.saved = true;
                    if (cb) cb();
                }                
            });
        },
        numberOfSameTypeSkins: function(skin) {
            if (skin.name[0] != "!")
                throw "numberOfTheSameType - non constructor skin";            
            var type = SkinConfig.splitCode(skin.name).type;
            var count = 0;
            var skins = skinModel.groups.list[0].skins;
            for(var i=0; i<skins.length; i++) {
                if (skins[i].name[0] == "!" && SkinConfig.splitCode(skins[i].name).type == type)
                    count++;
            }
            return count;
        },
        whenReady: function(cb) {
            var self = this;
            var wait = 20000;
            function waiter() {
                if (self.shopList.length) {
                    cb();
                }else if (wait > 0) {
                    wait -= 100;
                    setTimeout(waiter, 100);
                }
            }
            waiter();
        },
        getSkinBuilder: function(cb) {
            Utils.whenExist(function() { return sprites.skinBuilder },
                function(sb) { cb(sb, sprites.ctorData) });
        },
        getDynamicSprite: function(name, cb) {
            Utils.repeatUntilTrue(function() {
                return sprites._dynlist.length && (cb(sprites._dynamic[name]) || true);
            });
        },
        getSpriteWithCnavas: function(name, cb) {
            // without adding it to sprites cache
            if (name[0] == "!" || name[0] == "?") {
                this.getSkinBuilder( function(sb) {
                    sb.build({name: name}, function(result) {
                        result.skin.skin = new Skin(result.skin.skin);
                        cb(result.skin, result.canvas);
                    });
                });
            }else {
                this.getDynamicSprite(name, function(sprite) {
                    if (sprite) {
                        var img = new Image();
                        var done = false;
                        img.onload = function() {
                            if (done) return;
                            done = true;
                            cb(sprite, img);
                        };
                        img.src = sprite.src;
                        if (img.complete)
                            img.onload();
                    }
                });
            }
        },
        setCtorConfigs: function(cc) {
            this.ownsCtorSkin = false;
            this.ctorConfigs = cc;
            for(var j=0; j<freeCtorSkins.length; j++)
                freeCtorSkins[j].add = true;
            for(var i=0; i<cc.length; i++) {
                var isDefault = false;
                for(var j=0; j<freeCtorSkins.length; j++) {
                    if (cc[i].skin_code == freeCtorSkins[j].skin_code) {
                        freeCtorSkins[j].add = false;
                        isDefault = true;
                    }
                }
                this.ownsCtorSkin = this.ownsCtorSkin || !isDefault;
            }
            for(var j=0; j<freeCtorSkins.length; j++) {
                if (!this.ownsCtorSkin && freeCtorSkins[j].add)
                    cc.push(freeCtorSkins[j]);
            }
            ctorMakeThumbs();
        },
        reload: function(cb) {
            sprites.loadAsync(function () {
                $.ajax({url: '/api/v2/skins', headers: {"X-Matroid-Auth": config.auth || 'b'}, success: function (data) {
                    skinModel.my = my = data.my;
                    skinModel.groups = data.groups;
                    skinModel.shopList = [];
                    skinModel.byName = {};
                    var cc = data.ctor_configs;
                    my["free"] = -1;
                    
                    skinModel.setCtorConfigs(cc);

                    if ($rootScope.user.personal_skin)
                        my[$rootScope.user.personal_skin] = -1;
                    if (config.hideLicenseSkins) {
                        skinModel.groups.list = skinModel.groups.list.filter(function(group) {
                            return !group.defaults.license;
                        });
                    }
                    skinModel.groups.list.forEach(function (group) {
                        group.skins = [];
                        group.byName = {};
                        group.active = false;
                        group.mode = group.mode || 0;
                        if (typeof my[group.name] == "number") {
                            group.expire = my[group.name];
                            my[group.name] = group;
                            group.active = true;
                        }
                        var list = group.items;
                        list && list.forEach(function (skin) {
                            if (typeof skin == "string") skin = {name: skin}
                            var dyn = sprites._dynamic[skin.name];
                            if (dyn) {
                                skin.id = dyn.index;
                                if (!skin.license || !config.hideLicenseSkins)
                                    addSkinInGroup(group, skin);
                            } else {
                                list2 = sprites.byGroup[group.name];
                                list2 && list2.forEach(function (dyn) {
                                    var skin = {id: dyn.index, name: dyn.name}
                                    addSkinInGroup(group, skin);
                                });
                            }
                        });
                    });
                    var myGroup = {name: "my_skins", active: true, skins: [], byName: {}, alwaysVisible: true}
                    var count = 0;
                    for (var name in my) {
                        if (sprites._dynamic.hasOwnProperty(name)) {
                            count++;
                            var dyn = sprites._dynamic[name];
                            if (typeof my[name] == "number") {
                                var skin = {id: dyn.index, name: dyn.name, active: true, expire: my[name]}
                                addSkinInGroup(myGroup, skin);
                            } else {
                                var skin = my[name];
                                addSkinInSecondGroup(myGroup, skin);
                            }
                        }
                    }
                    skinModel.ownsSkin = count > 1;
                    for (var i = 0; i < cc.length; i++) {
                        var skin = {name: cc[i].skin_code, active: true, expire: -1, saved: cc[i].saved};
                        if (!skinModel.ownsCtorSkin)
                            skin.tooltip = i18nFilter("you_can_edit_this_skin");
                        addSkinInSecondGroup(myGroup, skin);
                    }
                    if (myGroup.skins.length > 0) {
                        skinModel.groups.list.unshift(myGroup);
                    }
                    skinModel.checkSkin();
                    if (!$rootScope.$$phase) {
                        $rootScope.$digest();
                    }
                    skinModel.dirty = false;
                    if (cb) cb();
                }});
            });
        },
        getSkinStyle : function(skin) {
            return skin.name && skin.name[0] == "!"
                ? (skinModel.ctorThumbStyles[skin.name] ? skinModel.ctorThumbStyles[skin.name].thumb : {})
                : sprites.getSkinStyleById(skin.id);
        },
        getShadowStyle : function(skin) {
            var meta = skin.name && skin.name[0] == "!"
                ? (skinModel.ctorThumbStyles[skin.name] ? skinModel.ctorThumbStyles[skin.name].meta : null)
                : sprites._dynlist[skin.id].shad;
            return shadowStyle(meta);
        }
    };

    var my = skinModel.my;

    function addSkinInGroup(group, skin) {
        if (group.byName[skin.name]) return;
        group.skins.push(skin);
        group.byName[skin.name] = skin;
        if(!skinModel.byName[skin.name]) {
            skinModel.shopList.push(skin);
            skinModel.byName[skin.name] = skin;
        }
        skin.shopGroup = group;
        skin.expire = 0;
        skin.active = false;
        if (typeof my[skin.name] == "number") {
            skin.expire = my[skin.name];
            skin.active = true;
            my[skin.name] = skin;
        } else if (group.active) {
            skin.active = true;
            skin.expire = group.expire;
        }
        if (group.defaults) {
            for (var key in group.defaults)
                if (group.defaults.hasOwnProperty(key) && !skin.hasOwnProperty(key))
                    skin[key] = group.defaults[key];
        }
        // new prices
        var durations = group.durations || skinModel.groups.durations;
        var price = skin.price || 0;
        skin.durations = [];
        for(var i=0; i<durations.length; i++) {
            var dur = durations[i];
            skin.durations.push({
                type: "skins",
                price: Math.ceil(dur.mul * price),
                gold_price: 0,
                name: skin.name, days: dur.days, skin: skin, mode: group.mode
            });
        }
        if (!skin.hasOwnProperty("platform")) {
            skin.platform = 0;
        }
    }

    function addSkinInSecondGroup(group, skin) {
        if (group.byName[skin.name]) return;
        group.skins.push(skin);
        group.byName[skin.name] = skin;
        skin.shopGroup = group;
        if (my.hasOwnProperty(skin.name))
            my[skin.name] = skin;
    }
    skinModel.checkSkin();
    skinModel.reload();
    console.log("skins service started")

    function ctorMakeThumbs(sb) {
        var tmpStyles = {}; // to free memory from old styles
        function body(sb) {
            for (var i=0; i<skinModel.ctorConfigs.length; i++) {
                var code = skinModel.ctorConfigs[i].skin_code;
                tmpStyles[code] = tmpStyles[code] || skinModel.ctorThumbStyles[code];
                if (!tmpStyles[code]) {
                    sb.build({name: code, onlyPublicFrame: true}, function(result) {
                        if (result.canvas) {
                            var canvas = makeBigThumbForCanvas(result.canvas,
                                result.skin.skin.renderWidth, sprites.shopThumbSize);
                            tmpStyles[code] = {
                                thumb: {
                                    'background-image': 'url(\'' + canvas.toDataURL() + '\')'
                                },
                                meta: def(result.skin.skin.shadow)
                                    ? {}
                                    : calcShadow(canvas.getContext("2d"), 0, 0, sprites.shopThumbSize, sprites.shopThumbSize)
                            }
                        }
                        // next thumb
                        body(sb);
                    });
                    return;
                }
            }
            skinModel.ctorThumbStyles = tmpStyles;
            if (!$rootScope.$$phase)
                $rootScope.$digest();
        }
        skinModel.getSkinBuilder(body);
    }

    return skinModel;
});