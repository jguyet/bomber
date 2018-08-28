bombermine.run(function(Game) {
    cheat_cmds = []

    setInterval(function() {
        for (var i=0;i<5;i++) {
            if (cheat_cmds.length>0) {
                var x = cheat_cmds.shift();
                Game.sendChatMsg(x);
            }
        }
    }, 100)

    function rand(x) {
        if (typeof x == "number")
            return Math.random() * x | 0;
        if (x instanceof Array)
            return x[Math.random() * x.length | 0];
        return x;
    }

    window.CHEAT = function(p) {
        this.players = []
        if (typeof p == "number") {
            var cp = []
            for (var i in Game.players.players)
                cp.push(Game.players.players[i].nickname)
            for (var i=0;i<p;i++)
                if (cp.length>0) {
                    this.players.push(cp.splice(Math.random()*p|0, 1))
                }
        } else
        if (p)
            this.players.push(p);
        else {
            for (var i in Game.players.players)
                this.players.push(Game.players.players[i].nickname)
        }
    }

    CHEAT.prototype = {
        skin: function(name) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/skin @"+this.players[i]+" "+rand(name))
            return this;
        },
        infect: function(name) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/infect @"+this.players[i]+" "+name)
            return this;
        },
        give: function(arg1, arg2) {
            for (var i=0;i<this.players.length;i++)
                if (arg2)
                    cheat_cmds.push("/give @"+this.players[i]+" "+arg1+" "+arg2)
                else
                    cheat_cmds.push("/give @"+this.players[i]+" "+arg1)
            return this;
        },
        fly : function(x, y) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/fly @"+this.players[i]+" "+x + " "+y)
            return this;
        },
        perk : function(name) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/perk @"+this.players[i]+" "+name)
            return this;
        },
        ball : function(rad) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/ball @"+this.players[i])
            return this;
        },
        pacman : function(rad) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/pacman @"+this.players[i])
            return this;
        },
        langolier : function(rad) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/langolier @"+this.players[i])
            return this;
        },
        nuke : function(rad) {
            for (var i=0;i<this.players.length;i++)
                if (rad)
                    cheat_cmds.push("/nuke @"+this.players[i]+" "+rad)
                else
                    cheat_cmds.push("/nuke @"+this.players[i])
            return this;
        },
        tile : function(tileName) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/tile @"+this.players[i]+" "+tileName)
            return this;
        },
        place : function(structureName) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/place @"+this.players[i]+" "+structureName)
            return this;
        },
        teleport : function(x, y) {
            for (var i=0;i<this.players.length;i++)
                cheat_cmds.push("/tp @"+this.players[i]+" "+x + " "+y)
            return this;
        },
        forEach: function(callback) {
            for (var i=0;i<this.players.length;i++)
                callback(new CHEAT(this.players[i]));
            return this;
        },
        flyRandom: function(r) {
            for (var i=0;i<this.players.length;i++) {
                var t = Math.random()*4|0, s = (Math.random()*r*2|0) - r;
                var x, y;
                if (t==0) {
                    x= s; y = r;
                }
                if (t==1) {
                    x= s; y = -r;
                }
                if (t==2) {
                    x= r; y = s;
                }
                if (t==3) {
                    x= -r; y = s;
                }
                cheat_cmds.push("/fly @"+this.players[i]+" "+x + " "+y)
            }
            return this;
        }
    }

    ponies = ["twilight", "flutt", "pink", "rarity", "rainbow", "apple", "bloom", "scoots"]
})