class CrossTabMessenger {
  static init(bridgeUrl) {
    if (this.initialized) {
      return this;
    }
    this.initialized = true;

    this.bridgeUrl = bridgeUrl;
    this.bridge = document.createElement("iframe");
    this.bridge.src = bridgeUrl;
    this.bridge.style.display = "none";
    document.body.appendChild(this.bridge);

    this.callbacks = { ping: [] };

    window.addEventListener("message", (e) => {
      if (e.origin !== new URL(bridgeUrl).origin) {
        return;
      }
      const { type, origin } = e.data || {};
      if (type && this.callbacks[type]) {
        this.callbacks[type].forEach((fn) => fn(origin));
      }
    });

    this.bridge.onload = () => {
      this.postToBridge({ type: "register-fallback" });
    };

    return this;
  }

  static postToBridge(msg) {
    this.bridge?.contentWindow?.postMessage(msg, this.bridgeUrl);
  }

  static ping() {
    this.postToBridge({ type: "ping" });
  }

  static onPing(fn) {
    this.callbacks.ping.push(fn);
  }
}

window.CrossTabMessenger = CrossTabMessenger;
