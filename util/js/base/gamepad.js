bombermine.service("gamepad", function($rootScope, storage, actions) {

    ///TODO: move codeProfile into actions

//  var gp = {
//    FACE_A: 0, // Face (main) buttons
//    FACE_B: 1,
//    FACE_X: 2,
//    FACE_Y: 3,
//    LEFT_SHOULDER: 4, // Top shoulder buttons
//    RIGHT_SHOULDER: 5,
//    LEFT_SHOULDER_BOTTOM: 6, // Bottom shoulder buttons
//    RIGHT_SHOULDER_BOTTOM: 7,
//    SELECT: 8,
//    START: 9,
//    LEFT_ANALOGUE_STICK: 10, // Analogue sticks (if depressible)
//    RIGHT_ANALOGUE_STICK: 11,
//    ARROW_UP: 12, // Directional (discrete) pad
//    ARROW_DOWN: 13,
//    ARROW_LEFT: 14,
//    ARROW_RIGHT: 15
//  };

  function Gamepad() {
    EventEmitter.call(this);

    this.ticking = false;
    this.gamepads = {};
    this.buttons = {};
    this.axes = {};
    this.prevGamepadIndexes = [];
    this.prevTimestamps = [];
    this.codeProfiles = {};

    this.init();
  }

  inherits(Gamepad, EventEmitter);

  Gamepad.prototype.init = function () {
    var thisAvailable = navigator.getGamepads || !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;

    if (!thisAvailable) {
      console.log('Gamepad API is not supported!');
    } else {
      // Check and see if gamepadconnected/gamepaddisconnected is supported.
      // If so, listen for those events and don't start polling until a gamepad
      // has been connected.
      if ('ongamepadconnected' in window) {
        window.addEventListener('gamepadconnected',
            this.onGamepadConnect.bind(this), false);
        window.addEventListener('gamepaddisconnected',
            this.onGamepadDisconnect.bind(this), false);
      } else {
        // If connection events are not supported just start polling
        this.startPolling();
      }
    }

  };

  Gamepad.prototype.onGamepadConnect = function (event) {
    // Add the new gamepad on the list of gamepads to look after.
    this.gamepads[event.gamepad.index] = event.gamepad;
    this.connectGamepad(event.gamepad.index);

    // Start the polling loop to monitor button changes.
    this.startPolling();
  };

  Gamepad.prototype.onGamepadDisconnect = function (event) {
    // Remove the gamepad from the list of gamepads to monitor.
    delete this.gamepads[event.gamepad.index];

    // If no gamepads are left, stop the polling loop.
    if (Object.keys(this.gamepads).length == 0) {
      this.stopPolling();
    }

    this.disconnectGamepad(event.gamepad.index);
  };

  Gamepad.prototype.startPolling = function () {
    // Don’t accidentally start a second loop, man.
    if (!this.ticking) {
      this.ticking = true;
      this.tick();
    }
  };

  Gamepad.prototype.stopPolling = function () {
    this.ticking = false;
  };

  Gamepad.prototype.tick = function () {
//    console.log('tick');
    this.pollStatus();
    this.scheduleNextTick();
  };

  Gamepad.prototype.scheduleNextTick = function () {
    // Only schedule the next frame if we haven’t decided to stop via
    // stopPolling() before.
    if (this.ticking) {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(this.tick.bind(this));
      } else if (window.mozRequestAnimationFrame) {
        window.mozRequestAnimationFrame(this.tick.bind(this));
      } else if (window.webkitRequestAnimationFrame) {
        window.webkitRequestAnimationFrame(this.tick.bind(this));
      }
      // Note lack of setTimeout since all the browsers that support
      // Gamepad API are already supporting requestAnimationFrame().
    }
  };

  Gamepad.prototype.pollStatus = function () {
    // Poll to see if gamepads are connected or disconnected. Necessary
    // only on Chrome.
    this.pollGamepads();

    for (var i in this.gamepads) {
      var gamepad = this.gamepads[i];

      // Don’t do anything if the current timestamp is the same as previous
      // one, which means that the state of the gamepad hasn’t changed.
      // This is only supported by Chrome right now, so the first check
      // makes sure we’re not doing anything if the timestamps are empty
      // or undefined.
      if (gamepad.timestamp &&
          (gamepad.timestamp == this.prevTimestamps[i])) {
        continue;
      }
      this.prevTimestamps[i] = gamepad.timestamp;

      this.updateDisplay(i);
    }
  };

  Gamepad.prototype.pollGamepads = function () {
    // Get the array of gamepads – the first method (getGamepads)
    // is the most modern one and is supported by Firefox 28+ and
    // Chrome 35+. The second one (webkitGetGamepads) is a deprecated method
    // used by older Chrome builds.
    var rawGamepads =
        (navigator.getGamepads && navigator.getGamepads()) ||
        (navigator.webkitGetGamepads && navigator.webkitGetGamepads());

    if (rawGamepads) {
      // We don’t want to use rawGamepads coming straight from the browser,
      // since it can have “holes” (e.g. if you plug two gamepads, and then
      // unplug the first one, the remaining one will be at index [1]).
      this.gamepads = {};
      var gamepadInexes = [];

      for (var i = 0; i < rawGamepads.length; i++) {
        if (rawGamepads[i]) {
          this.gamepads[rawGamepads[i].index] = rawGamepads[i];
          gamepadInexes.push(rawGamepads[i].index);
        }
      }

      var addedGamepad = difference(gamepadInexes, this.prevGamepadIndexes);
      var removedGamepad = difference(this.prevGamepadIndexes, gamepadInexes);

      addedGamepad.forEach(this.connectGamepad.bind(this));
      removedGamepad.forEach(this.disconnectGamepad.bind(this));

      this.prevGamepadIndexes = gamepadInexes;
    }
  };

  Gamepad.prototype.connectGamepad = function(gamepadNum){
    // TODO emit event 'gamepads changed'
//    console.log('added gamepads', index);
    this.emit('gamepadConnected', gamepadNum);
    this.buttons[gamepadNum] = [];
    this.axes[gamepadNum] = [];

    var gamePadName = this.getGamepadName(gamepadNum);
    console.log('connected gamepad:', gamePadName);

    this.codeProfiles[gamepadNum] = actions.connectGamepad(gamePadName);
  };

  Gamepad.prototype.disconnectGamepad = function(gamepadNum){
    // TODO emit event 'gamepads changed'
    console.log('removed gamepads', gamepadNum);
    this.emit('gamepadDisconnected', gamepadNum);
    delete this.buttons[gamepadNum];
    delete this.axes[gamepadNum];
    delete this.codeProfiles[gamepadNum]
  };

  Gamepad.prototype.getGamepadName = function(index){
    return this.gamepads[index] && this.gamepads[index].id;;
  };

// Call the tester with new state and ask it to update the visual
// representation of a given gamepad.
  Gamepad.prototype.updateDisplay = function (gamepadId) {
    var gamepad = this.gamepads[gamepadId];
    var buttonsChanged = false;

    // Buttons

    for(var i = 0; i < gamepad.buttons.length; i++){

      var button = gamepad.buttons[i];
      var oldButton = this.buttons[gamepadId][i];

      if (this._isKeyDown(button, oldButton)) {
        this.emit('keydown', i, gamepadId);
        buttonsChanged = true;
      }

      if (this._isKeyUp(button, oldButton)) {
        this.emit('keyup', i, gamepadId);
        buttonsChanged = true;
      }
    }

    if (buttonsChanged) {
      this.buttons[gamepadId] = gamepad.buttons.map(function(button){
        var obj = {
          pressed: button.pressed,
          value: button.value
        };
        return obj;
      });
    }

    // Axes

    var axesChanged = false;

    var axes = this.convertAxes(gamepad.axes);

    for(i = 0; i < axes.length; i++){

      var axe = axes[i];
      var oldAxe = this.axes[gamepadId][i];

      if (this._isKeyDown(axe, oldAxe)) {
        this.emit('keydown', 100 + i, gamepadId);
        axesChanged = true;
      }

      if (this._isKeyUp(axe, oldAxe)) {
        this.emit('keyup', 100 + i, gamepadId);
        axesChanged = true;
      }
    }

    if (axesChanged) {
      this.axes[gamepadId] = axes;
    }

  };

  Gamepad.prototype.mapCode = function(code, gamepadNum){
    return this.codeProfiles[gamepadNum][String(code)];
  };

  Gamepad.prototype._isKeyDown = function(newKey, oldKey){
    return newKey.pressed && (!oldKey || !oldKey.pressed);
  };

  Gamepad.prototype._isKeyUp = function(newKey, oldKey){
    return !newKey.pressed && oldKey && oldKey.pressed;
  };


  Gamepad.prototype.convertAxes = function (axes) {
    var result = [];

    for(var i = 0; i < axes.length; i++){
      var axe = axes[i];
      result.push({pressed: axe > 0.5});
      result.push({pressed: axe < -0.5});
    }
    return result;
  };

  function difference(a, b){
    return a.filter(function(n) {
      return b.indexOf(n) === -1
    });
  }

  return new Gamepad();
});