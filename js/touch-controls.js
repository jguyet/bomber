/**
 * Touch Controls — Virtual D-pad and bomb button for touch devices.
 * Maps touch events to the same keyCodes used by keyboard input (events.js).
 */
var TouchControls = (function () {

	var KEY_UP    = 38;
	var KEY_DOWN  = 40;
	var KEY_LEFT  = 37;
	var KEY_RIGHT = 39;
	var KEY_BOMB  = 32;

	function isTouchDevice() {
		return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
	}

	function buildDOM() {
		var container = document.getElementById('touch-controls');
		if (!container) return;

		container.style.display = 'block';

		// D-pad
		var dpad = document.createElement('div');
		dpad.className = 'touch-dpad';

		var btnUp = document.createElement('button');
		btnUp.className = 'dpad-up';
		btnUp.setAttribute('aria-label', 'Move up');
		btnUp.textContent = '\u25B2';

		var btnLeft = document.createElement('button');
		btnLeft.className = 'dpad-left';
		btnLeft.setAttribute('aria-label', 'Move left');
		btnLeft.textContent = '\u25C0';

		var center = document.createElement('div');
		center.className = 'dpad-center';

		var btnRight = document.createElement('button');
		btnRight.className = 'dpad-right';
		btnRight.setAttribute('aria-label', 'Move right');
		btnRight.textContent = '\u25B6';

		var btnDown = document.createElement('button');
		btnDown.className = 'dpad-down';
		btnDown.setAttribute('aria-label', 'Move down');
		btnDown.textContent = '\u25BC';

		dpad.appendChild(btnUp);
		dpad.appendChild(btnLeft);
		dpad.appendChild(center);
		dpad.appendChild(btnRight);
		dpad.appendChild(btnDown);

		// Bomb button
		var btnBomb = document.createElement('button');
		btnBomb.className = 'touch-bomb';
		btnBomb.setAttribute('aria-label', 'Place bomb');
		btnBomb.textContent = '\uD83D\uDCA3';

		container.appendChild(dpad);
		container.appendChild(btnBomb);

		return {
			up: btnUp,
			down: btnDown,
			left: btnLeft,
			right: btnRight,
			bomb: btnBomb
		};
	}

	function bindDirection(btn, keyCode) {
		btn.addEventListener('touchstart', function (e) {
			e.preventDefault();
			if (isSpectating) return;
			if (keyState[keyCode] === true) return;
			keyState[keyCode] = true;
			sendSocketMessage('KD' + keyCode);
		}, { passive: false });

		btn.addEventListener('touchend', function (e) {
			e.preventDefault();
			keyState[keyCode] = false;
			sendSocketMessage('KU' + keyCode);
		}, { passive: false });

		btn.addEventListener('touchcancel', function (e) {
			e.preventDefault();
			keyState[keyCode] = false;
			sendSocketMessage('KU' + keyCode);
		}, { passive: false });
	}

	function bindBomb(btn) {
		btn.addEventListener('touchstart', function (e) {
			e.preventDefault();
			if (isSpectating) return;
			keyState[KEY_BOMB] = true;
			sendSocketMessage('KD' + KEY_BOMB);
			setTimeout(function () {
				keyState[KEY_BOMB] = false;
				sendSocketMessage('KU' + KEY_BOMB);
			}, 50);
		}, { passive: false });
	}

	function init() {
		if (!isTouchDevice()) return;

		var buttons = buildDOM();
		if (!buttons) return;

		bindDirection(buttons.up, KEY_UP);
		bindDirection(buttons.down, KEY_DOWN);
		bindDirection(buttons.left, KEY_LEFT);
		bindDirection(buttons.right, KEY_RIGHT);
		bindBomb(buttons.bomb);
	}

	return {
		init: init
	};

})();
