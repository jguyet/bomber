var HUD = (function() {
  var timerInterval = null;

  return {
    // Called when RS message received
    updateRoundState: function(state, timeRemainingMs) {
      var timerEl = document.getElementById('round-timer');
      var timerText = document.getElementById('round-timer-text');
      var stateText = document.getElementById('round-timer-state');

      if (!timerEl || !timerText || !stateText) return;

      timerEl.style.display = 'block';

      if (state === 'waiting') {
        timerText.textContent = '--:--';
        stateText.textContent = 'Waiting for players...';
        timerEl.classList.remove('urgent', 'critical');
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
      } else if (state === 'active') {
        stateText.textContent = '';
        // Update timer display
        this._updateTimerDisplay(timeRemainingMs);
        // Start local countdown (update every 100ms for smooth display)
        this._startLocalTimer(timeRemainingMs);
      } else if (state === 'ended') {
        stateText.textContent = 'Round Over!';
        timerEl.classList.remove('urgent', 'critical');
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    _startLocalTimer: function(timeRemainingMs) {
      if (timerInterval) clearInterval(timerInterval);
      var endTime = Date.now() + timeRemainingMs;
      var self = this;
      timerInterval = setInterval(function() {
        var remaining = Math.max(0, endTime - Date.now());
        self._updateTimerDisplay(remaining);
        if (remaining <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }, 100);
    },

    _updateTimerDisplay: function(ms) {
      var timerText = document.getElementById('round-timer-text');
      var timerEl = document.getElementById('round-timer');
      if (!timerText || !timerEl) return;

      var totalSeconds = Math.ceil(ms / 1000);
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = totalSeconds % 60;
      timerText.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

      // Urgency classes
      timerEl.classList.toggle('urgent', totalSeconds <= 30 && totalSeconds > 10);
      timerEl.classList.toggle('critical', totalSeconds <= 10);
    },

    // Called when SB message received
    updateScoreboard: function(data) {
      var container = document.getElementById('hud-scoreboard');
      var tbody = document.getElementById('hud-scoreboard-body');
      if (!container || !tbody) return;

      container.style.display = 'block';

      // Sort by kills desc, then deaths asc
      data.sort(function(a, b) { return b.kills - a.kills || a.deaths - b.deaths; });

      tbody.innerHTML = '';
      for (var i = 0; i < data.length; i++) {
        var row = document.createElement('tr');
        var isCurrentPlayer = (currentPlayer && data[i].id === currentPlayer.id);
        if (isCurrentPlayer) row.classList.add('current-player');
        row.innerHTML = '<td class="sb-name">' + escapeHtml(data[i].nickname) + '</td>'
          + '<td class="sb-kills">' + data[i].kills + '</td>'
          + '<td class="sb-deaths">' + data[i].deaths + '</td>';
        tbody.appendChild(row);
      }
    },

    // Called when KF message received
    addKillFeedEntry: function(killEvent) {
      // Kill feed is displayed in chat via addKillToChat() — this method can add HUD-level kill feed if desired
    },

    // Called when RE message received
    showResults: function(winner, results) {
      var screen = document.getElementById('results-screen');
      var titleEl = document.getElementById('results-title');
      var winnerEl = document.getElementById('results-winner');
      var tbody = document.getElementById('results-table-body');
      var countdownEl = document.getElementById('results-countdown');

      if (!screen || !titleEl || !winnerEl || !tbody || !countdownEl) return;

      screen.style.display = 'flex';
      titleEl.textContent = 'Round Over!';
      winnerEl.textContent = winner && winner.nickname ? 'Winner: ' + winner.nickname : 'Draw \u2014 No Winner';

      // Make results container focusable for keyboard accessibility
      var container = screen.querySelector('.results-container');
      if (container) {
        container.setAttribute('tabindex', '-1');
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-label', 'Round results');
        container.focus();
      }

      // Sort results by kills desc
      results.sort(function(a, b) { return b.kills - a.kills || a.deaths - b.deaths; });

      tbody.innerHTML = '';
      for (var i = 0; i < results.length; i++) {
        var row = document.createElement('tr');
        if (winner && results[i].id === winner.id) row.classList.add('winner-row');
        row.innerHTML = '<td>' + (i + 1) + '</td>'
          + '<td>' + escapeHtml(results[i].nickname) + '</td>'
          + '<td>' + results[i].kills + '</td>'
          + '<td>' + results[i].deaths + '</td>';
        tbody.appendChild(row);
      }

      // Countdown
      var seconds = 5;
      countdownEl.textContent = 'Next round in ' + seconds + 's...';
      var countdownInterval = setInterval(function() {
        seconds--;
        if (seconds <= 0) {
          clearInterval(countdownInterval);
          countdownEl.textContent = 'Starting...';
        } else {
          countdownEl.textContent = 'Next round in ' + seconds + 's...';
        }
      }, 1000);
    },

    hideResults: function() {
      var screen = document.getElementById('results-screen');
      if (screen) screen.style.display = 'none';
    },

    // Show explosion/death visual feedback: red flash overlay + canvas shake
    showExplosionFeedback: function() {
      // Red flash overlay
      var flash = document.getElementById('explosion-flash');
      if (flash) {
        flash.style.display = 'block';
        flash.classList.remove('flash-active');
        // Force reflow to restart animation
        void flash.offsetWidth;
        flash.classList.add('flash-active');
        setTimeout(function() {
          flash.classList.remove('flash-active');
          flash.style.display = 'none';
        }, 300);
      }
      // Canvas shake
      var viewport = document.getElementById('viewport');
      if (viewport) {
        viewport.classList.remove('shake-active');
        void viewport.offsetWidth;
        viewport.classList.add('shake-active');
        setTimeout(function() {
          viewport.classList.remove('shake-active');
        }, 300);
      }
    },

    // Show death notice for spectating player
    showDeathNotice: function() {
      // Trigger explosion visual feedback on death
      this.showExplosionFeedback();
      var stateText = document.getElementById('round-timer-state');
      if (stateText) {
        stateText.textContent = 'YOU DIED \u2014 Spectating';
        stateText.classList.add('death-notice');
      }
      // Auto-clear the death notice after 2 seconds, revert to empty if round still active
      setTimeout(function() {
        if (stateText && roundState === 'active') {
          stateText.textContent = '';
          stateText.classList.remove('death-notice');
        }
      }, 2000);
    },

    // Set room name and theme in HUD (top-left during gameplay)
    setRoomInfo: function(roomName, themeId) {
      var container = document.getElementById('hud-room-info');
      var nameEl = document.getElementById('hud-room-name');
      var themeEl = document.getElementById('hud-theme-badge');
      if (!container) return;
      container.style.display = 'flex';
      if (nameEl) nameEl.textContent = roomName;
      var themeLabels = { 'default': '\uD83C\uDF3F Default', 'winter': '\u2744\uFE0F Winter', 'moon': '\uD83C\uDF19 Moon' };
      if (themeEl) themeEl.textContent = themeLabels[themeId] || themeId;
    },

    // Hide room info HUD
    hideRoomInfo: function() {
      var container = document.getElementById('hud-room-info');
      if (container) container.style.display = 'none';
    },

    // Reset everything for new round
    reset: function() {
      this.hideResults();
      var tbody = document.getElementById('hud-scoreboard-body');
      if (tbody) tbody.innerHTML = '';
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  };
})();
