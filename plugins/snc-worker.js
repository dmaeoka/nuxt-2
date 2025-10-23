export default (context, inject) => {
  let isReady = false;
  const readyCallbacks = [];

  // Initialize CrossTabMessenger with bridge
  if (process.client) {
    // Load CrossTabMessenger script if not already loaded
    if (!window.CrossTabMessenger) {
      const script = document.createElement('script');
      script.src = '/CrossTabMessenger.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        initMessenger();
      };
    } else {
      initMessenger();
    }

    function initMessenger() {
      const bridgeUrl = `${window.location.origin}/bridge.html`;
      window.CrossTabMessenger.init(bridgeUrl);
      isReady = true;
      readyCallbacks.forEach(cb => cb());
      readyCallbacks.length = 0;
    }
  }

  // Helper to ensure CrossTabMessenger is ready
  function whenReady(callback) {
    if (isReady) {
      callback();
    } else {
      readyCallbacks.push(callback);
    }
  }

  // Inject $SncWorker methods
  inject('SncWorker', {
    send: (message) => {
      if (process.client && window.CrossTabMessenger) {
        window.CrossTabMessenger.postToBridge(message);
      } else {
        console.warn('[SncWorker Plugin] CrossTabMessenger not available');
      }
    },
    sendObject: (type, data) => {
      if (process.client && window.CrossTabMessenger) {
        window.CrossTabMessenger.postToBridge({ type, data });
        console.log('[SncWorker Plugin] Object sent:', { type, data });
      } else {
        console.warn('[SncWorker Plugin] CrossTabMessenger not available');
      }
    },
    onMessage: (type, callback) => {
      whenReady(() => {
        if (process.client && window.CrossTabMessenger) {
          if (!window.CrossTabMessenger.callbacks[type]) {
            window.CrossTabMessenger.callbacks[type] = [];
          }
          window.CrossTabMessenger.callbacks[type].push(callback);
          console.log(`[SncWorker Plugin] Registered callback for type: ${type}`);
        }
      });
    },
    ping: () => {
      if (process.client && window.CrossTabMessenger) {
        window.CrossTabMessenger.ping();
      }
    },
    onPing: (callback) => {
      whenReady(() => {
        if (process.client && window.CrossTabMessenger) {
          window.CrossTabMessenger.onPing(callback);
        }
      });
    }
  });
}
