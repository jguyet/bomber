bombermine.service("actions", function ($rootScope, storage, Keys, Game) {

    function InputList(name) {
        this.actionMap = {};
        this.keyMap = {};
        this.name = name;
    }

    InputList.prototype = {
        loadKeyMap: function (keyMap) {
            this.keyMap = {};
            this.actionMap = {};
            for (var action in keyMap)
                if (keyMap.hasOwnProperty(action)) {
                    this.bind(action, keyMap[action]);
                }
        },
        load: function (def) {
            var res = def;
            var test = storage.getItem("Input/"+this.name, null);
            if (test) {
                try {
                    res = JSON.parse(test);
                }
                catch (e) {
                    //nothing, codes werent loaded
                }
            }
            this.loadKeyMap(res);
        },
        save: function() {
            storage.setItem("Input/"+this.name, JSON.stringify(this.keyMap));
        },
        bind: function (action, keyCode) {
            this.unbind(action);
            this.unbindKey(keyCode);
            this.keyMap[action] = keyCode;
            this.actionMap[keyCode] = action;
        },
        unbind: function (action) {
            var keyCode = this.keyMap[action];
            if (typeof keyCode !== "undefined") {
                delete this.actionMap[keyCode];
                delete this.keyMap[action];
            }
        },
        unbindKey: function(keyCode) {
            var action =this.actionMap[keyCode];
            if (typeof action !== "undefined") {
                delete this.actionMap[keyCode];
                delete this.keyMap[action];
            }
        }

    };

    // ---------------------------------------------------------------------------
    // CLASS ACTIONS
    // ---------------------------------------------------------------------------

    function Actions() {
        this.up = {};
        this.down = {};
        this.list = [];
        this.defs = {
            kb0 : new InputList("key0"),
            kb1 : new InputList("key1"),
            gp: new InputList("gamepad")
        };
        this.inputs = {
            kb : new InputList("keyboard"),
            gp : new InputList("none")
        };
    }

    Actions.prototype.add = function (name, kb, gp, fn, fnUp) {
        var def = this.defs;
        if (kb.length == 2) {
            def.kb0.bind(name, kb[0]);
            def.kb1.bind(name, kb[1]);
        } else {
            def.kb1.bind(name, kb[0]);
        }
        if (gp.length==1) {
            def.gp.bind(name, gp[0]);
        }
        this.list.push(name);
        this.down[name] = fn;
        if (fnUp)
            this.up[name] = fnUp;
    };

    Actions.prototype.addDown = function (name, fn) {
        this.down[name] = fn;
    };

    Actions.prototype._press = function (type, action) {
        try {
            this[type][action] && this[type][action]();
        } catch (e) {
            console.log('Error while action: ', e);
        }
    };

    Actions.prototype.pressKeyboardUp = function (keyCode) {
        var action = this.defs.kb0.actionMap[keyCode] ||
            this.inputs.kb.actionMap[keyCode];
        this._press('up', action);
    };

    Actions.prototype.pressKeyboardDown = function (keyCode) {
        var action = this.defs.kb0.actionMap[keyCode] ||
            this.inputs.kb.actionMap[keyCode];
        this._press('down', action);
    };

    Actions.prototype.pressGamepadUp = function (action) {
        this._press('up', action);
    };

    Actions.prototype.pressGamepadDown = function (action) {
        this._press('down', action);
    };

    Actions.prototype.isKeyboardCode = function (keyCode) {
        return (this.defs.kb0.actionMap.hasOwnProperty(keyCode) ||
            this.inputs.kb.actionMap.hasOwnProperty(keyCode))
    };

    Actions.prototype.connectGamepad = function (name) {
        var gp = this.inputs.gp = new InputList(name);
        gp.load(this.defs.gp.keyMap);
        return gp;
    };

    Actions.prototype.getKeyName = function(keyCode) {
        if (typeof keyCode === "undefined") return "";
        return kbInv[keyCode] || String.fromCharCode(keyCode);
    };

    Actions.prototype.getButtonName = function(buttonCode) {
        if (typeof buttonCode === "undefined") return "";
        if (buttonCode<100)
            return 'B'+buttonCode;
        return 'AXIS'+((buttonCode-100)>>1) + (buttonCode%2?"-":"+");
    };

    Actions.prototype.loadSettings = function() {
        this.inputs.kb.load(this.defs.kb1.keyMap);
        this.inputs.gp.load(this.defs.gp.keyMap);
    };

    Actions.prototype.saveSettings = function() {
        this.inputs.kb.save();
        if (this.inputs.gp.name != "none")
            this.inputs.gp.save();
    };

    var act = new Actions();

    // ---------------------------------------------------------------------------
    // KEY TABLE
    // ---------------------------------------------------------------------------

    // GamePad
    // to see the schema look at:
    // http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/tester.html

    // Keyboard

    var specialKeys = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        SPACE: 32,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    }

    var kbInv = {};
    for (var key in specialKeys) {
        kbInv[specialKeys[key]] = key;
    }

    var kb = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        SPACE: 32,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40,
        NUM_1: 49,
        NUM_8: 56,
        A: 65,
        D: 68,
        I: 73,
        K: 75,
        L: 76,
        P: 80,
        Q: 81,
        W: 87,
        S: 83,
        Z: 90
    };
    // ---------------------------------------------------------------------------
    // ACTIONS DOWN
    // ---------------------------------------------------------------------------

    // Arrows
    act.add('up', [kb.ARROW_UP, kb.W], [103], function () {
        Keys.keyDown(2);
    }, function() {
        Keys.keyUp(2);
    });

    act.add('down', [kb.ARROW_DOWN, kb.S], [102], function () {
        Keys.keyDown(8);
    }, function() {
        Keys.keyUp(8);
    });

    act.add('left', [kb.ARROW_LEFT, kb.A], [101], function () {
        Keys.keyDown(4);
    }, function() {
        Keys.keyUp(4);
    });

    act.add('right', [kb.ARROW_RIGHT, kb.D], [100], function () {
        Keys.keyDown(1);
    }, function() {
        Keys.keyUp(1);
    });

    act.add('bomb', [kb.SPACE, kb.K], [2], function () {
        Game.appInputBomb();
        Keys.keyDown(32);
    }, function() {
        Keys.keyUp(32);
    });

    act.add('observe', [kb.Q], [0], function () {
        Keys.keyDown(16);
    }, function() {
        Keys.keyUp(16);
    });



    act.add('detonation', [kb.SHIFT, kb.L], [1], function () {
        Game.appInputDetonation();
    });

    act.add('chat', [kb.ENTER], [], function () {
        Game.appInputChat();
    });

    act.add('scoreboard', [kb.TAB], [], function () {
        Game.appInputTab();
    });

    act.add('fullscreen', [kb.P], [], function () {
        Game.toggleFullScreen();
    });

    act.add('pause', [kb.I], [3], function () {
        Game.appInputPause();
    });

    act.loadSettings();

//  console.log('act', act);
    return act;

});