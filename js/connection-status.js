// ─── Connection Status Manager ──────────────────────────────────────────────
var ConnectionStatus = {
  maxRetries: 10,
  currentRetry: 0,
  isConnected: false,
  hasBeenConnected: false,
  overlay: null,

  init: function() {
    this.overlay = document.getElementById('connection-overlay');
  },

  onConnected: function() {
    this.isConnected = true;
    this.currentRetry = 0;

    if (!this.overlay) this.init();

    // Only show reconnected message if we were previously connected
    if (this.hasBeenConnected && this.overlay.style.display !== 'none') {
      document.getElementById('connection-icon').innerHTML = '&#x2714;';
      document.getElementById('connection-text').textContent = 'Reconnected!';
      document.getElementById('connection-detail').textContent = '';
      this.overlay.classList.remove('failed');
      this.overlay.classList.add('success');
      var self = this;
      setTimeout(function() {
        self.overlay.style.display = 'none';
        self.overlay.classList.remove('success');
      }, 2000);
    }

    this.hasBeenConnected = true;
  },

  onDisconnected: function() {
    this.isConnected = false;

    if (!this.overlay) this.init();

    // Only show disconnect overlay if we were previously connected
    if (!this.hasBeenConnected) return;

    this.overlay.style.display = 'flex';
    this.overlay.classList.remove('success');
    this.overlay.classList.remove('failed');
    document.getElementById('connection-icon').innerHTML = '&#x26A0;';
    document.getElementById('connection-text').textContent = 'Connection lost';
    this.updateRetryInfo();
  },

  onRetrying: function(attempt) {
    this.currentRetry = attempt;
    this.updateRetryInfo();
  },

  updateRetryInfo: function() {
    var detail = document.getElementById('connection-detail');
    if (!detail) return;

    if (this.currentRetry >= this.maxRetries) {
      detail.textContent = 'Failed to reconnect. Please refresh the page.';
      document.getElementById('connection-icon').innerHTML = '&#x2716;';
      this.overlay.classList.add('failed');
    } else {
      detail.textContent = 'Reconnecting... (attempt ' + (this.currentRetry + 1) + '/' + this.maxRetries + ')';
    }
  },

  onPermanentFailure: function() {
    if (!this.overlay) this.init();

    this.overlay.style.display = 'flex';
    this.overlay.classList.remove('success');
    this.overlay.classList.add('failed');
    document.getElementById('connection-icon').innerHTML = '&#x2716;';
    document.getElementById('connection-text').textContent = 'Connection lost';
    document.getElementById('connection-detail').textContent = 'Failed to reconnect. Please refresh the page.';
  }
};
