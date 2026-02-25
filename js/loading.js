// ─── Loading Screen Manager ─────────────────────────────────────────────────
var LoadingManager = {
  totalAssets: 0,
  loadedAssets: 0,
  loadTimeout: null,

  show: function() {
    var el = document.getElementById('loading-screen');
    if (el) {
      el.style.display = 'flex';
      el.classList.remove('fade-out');
    }
    // Start slow-load timeout
    var self = this;
    if (this.loadTimeout) clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(function() {
      if (self.loadedAssets < self.totalAssets) {
        self.setStatus('Loading is taking longer than expected...');
      }
    }, 15000);
  },

  hide: function() {
    // Clear slow-load timeout
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    var el = document.getElementById('loading-screen');
    if (el) {
      el.classList.add('fade-out');
      setTimeout(function() {
        el.style.display = 'none';
      }, 300);
    }
  },

  setTotal: function(n) {
    this.totalAssets = n;
    this.loadedAssets = 0;
    var bar = document.getElementById('loading-bar');
    if (bar) bar.style.width = '0%';
    var status = document.getElementById('loading-status');
    if (status) status.textContent = 'Loading assets... 0%';
    var detail = document.getElementById('loading-detail');
    if (detail) detail.textContent = '';
  },

  assetLoaded: function(name) {
    this.loadedAssets++;
    if (this.totalAssets <= 0) return; // Guard: no loading session active
    var pct = Math.min(100, Math.round((this.loadedAssets / this.totalAssets) * 100));
    var bar = document.getElementById('loading-bar');
    if (bar) bar.style.width = pct + '%';
    var detail = document.getElementById('loading-detail');
    if (detail) detail.textContent = name;
    var status = document.getElementById('loading-status');
    if (status) status.textContent = 'Loading assets... ' + pct + '%';
  },

  setStatus: function(text) {
    var status = document.getElementById('loading-status');
    if (status) status.textContent = text;
  },

  worldReady: function() {
    this.setStatus('World initialized!');
    var self = this;
    setTimeout(function() {
      self.hide();
    }, 300);
  }
};
