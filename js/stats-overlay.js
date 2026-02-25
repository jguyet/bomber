// ─── Stats Overlay — Player Profile & Leaderboard ──────────────────────────
var StatsOverlay = (function() {
  var isVisible = false;

  function init() {
    var btn = document.getElementById('stats-btn');
    if (btn) btn.addEventListener('click', toggle);
    var closeBtn = document.getElementById('stats-overlay-close');
    if (closeBtn) closeBtn.addEventListener('click', hide);
  }

  function toggle() {
    if (isVisible) hide();
    else show();
  }

  function show() {
    var overlay = document.getElementById('stats-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    isVisible = true;
    fetchStats();
  }

  function hide() {
    var overlay = document.getElementById('stats-overlay');
    if (overlay) overlay.style.display = 'none';
    isVisible = false;
  }

  function fetchStats() {
    var nickname = playerNickname || 'Player';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/stats/' + encodeURIComponent(nickname), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          var stats = JSON.parse(xhr.responseText);
          renderStats(stats);
        } catch (e) { console.error('Stats parse error:', e); }
      }
    };
    xhr.send();
    // Also fetch leaderboard
    fetchLeaderboard();
  }

  function fetchLeaderboard() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/leaderboard', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          var lb = JSON.parse(xhr.responseText);
          renderLeaderboard(lb);
        } catch (e) { console.error('Leaderboard parse error:', e); }
      }
    };
    xhr.send();
  }

  function renderStats(stats) {
    setText('stats-nickname', stats.nickname || playerNickname);
    setText('stats-kills', stats.kills || 0);
    setText('stats-deaths', stats.deaths || 0);
    setText('stats-games', stats.gamesPlayed || 0);
    setText('stats-wins', stats.wins || 0);
    var wr = stats.winRate ? (stats.winRate * 100).toFixed(1) + '%' : '0%';
    setText('stats-winrate', wr);
    var kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toString();
    setText('stats-kd', kd);
  }

  function renderLeaderboard(data) {
    var tbody = document.getElementById('stats-leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (var i = 0; i < data.length; i++) {
      var row = document.createElement('tr');
      var isMe = data[i].nickname.toLowerCase() === (playerNickname || '').toLowerCase();
      if (isMe) row.classList.add('stats-highlight');
      var wr = data[i].winRate ? (data[i].winRate * 100).toFixed(1) + '%' : '0%';
      row.innerHTML = '<td>' + (data[i].rank || (i + 1)) + '</td>'
        + '<td>' + escapeHtml(data[i].nickname) + '</td>'
        + '<td>' + data[i].wins + '</td>'
        + '<td>' + data[i].kills + '</td>'
        + '<td>' + wr + '</td>';
      tbody.appendChild(row);
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  return { show: show, hide: hide, toggle: toggle, fetchStats: fetchStats };
})();
