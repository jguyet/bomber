/**
 * Created by Liza on 14.05.2015.
 */
bombermine.service("Sounds", function ($http, $location, $rootScope, i18nFilter, Game, UserService, storage) {
    var path = "assets/sounds/";
    var Sounds = {
        mute: !(storage.getItem("sounds") == "true"),
        howls: {},
        howlsList: [],
        events: {},
        eventsList: [],
        setMute: function(value) {
            if (Sounds.mute && !value)
                Sounds.reload();
            Sounds.mute = value;
            storage.setItem("sounds", !value);
        },
        setMuteDontSave: function(value) {
            if (Sounds.mute && !value)
                Sounds.reload();
            Sounds.mute = value;
        },
        isMuted: function() {
            return Sounds.mute
        },
        setVolume: function(value) {
            Howler.volume(value/100.0);
            storage.setItem("volume", value);
        },
        getVolume: function() {
            return Howler.volume();
        },
        init: function() {
            Howler.volume(storage.getItem("volume", 100.0)/100.0)
        },
        playRandom: function() {
            if (Sounds.howlsList.length==0) return;
            return Sounds.howlsList[Math.random()*Sounds.howlsList.length|0].play();
        },
        reload: function() {
            $http.get("assets/sounds/fx.json")
                .success(function(data) {
                    //fill howls
                    Sounds.howls = {};
                    Sounds.howlsList = [];
                    var hh = data.howls;
                    for (var i=0;i<hh.length;i++) {
                        var obj = hh[i];
                        if (typeof hh[i]==="string") {
                            obj = {name: hh[i], src: [ path + hh[i]+".wav" ] };
                        } else {
                            for (var j=0;j<obj.src.length;j++)
                                if (obj.src[j].indexOf("://")<0)
                                    obj.src[j] = path + obj.src[j];
                        }
                        var howl = new Howl(obj);
                        Sounds.howls[obj.name] = howl;
                        Sounds.howlsList.push(howl);
                    }
                    //fill events
                    var ee = data.events;
                    Sounds.events = {};
                    Sounds.eventsList = [];
                    for (var i=0;i<ee.length;i++) {
                        var obj = ee[i];
                        if (typeof ee[i] === "string") {
                            obj = {name: ee[i], list: [ee[i]]};
                        }
                        Sounds.events[obj.name] = obj;
                        Sounds.eventsList.push(obj);
                    }
                })
                .error(function(err, status) {
                    console.log("cant load fx.json file")
                })
        },
        playEvent: function(name, dx, dy, dz) {
            if (Sounds.mute) return;
            var howl = null;
            var panner = null;
            var maxDistance = 10000;
            if (Sounds.events.hasOwnProperty(name)) {
                var ev = Sounds.events[name];
                panner = ev.panner || null;
                maxDistance = ev.maxDistance || maxDistance;
                howl = Sounds.howls[ev.list[Math.random()*ev.list.length|0]];
            }
            if (!howl && Sounds.howls.hasOwnProperty(name)) {
                howl = Sounds.howls[name];
            }
            if (!howl) return;
            var p;
            if (typeof dx !== "undefined" && panner!=null) {
                if (dx<-maxDistance|| dx>maxDistance || dy<-maxDistance || dy>maxDistance || dz<-maxDistance || dz>maxDistance) return;
                //howl.pannerAttr(panner);
                p = howl.play();
                howl.pannerAttr(panner, p);
                console.log("sound "+howl._src+" at position ("+dx+","+dy+","+dz+")");
                howl.pos(dx, dy, dz, p);
            } else {
                p = howl.play();
            }
            return p;
        }
    };

    Sounds.init();
    if (!Sounds.mute)
        Sounds.reload();
    window.Sounds = Sounds;

    return Sounds;
})