<template>
  <div class="domain-container">
    <header>
      <h1>Domain A (Sender)</h1>
      <p>This page simulates a domain that sends messages across tabs.</p>
    </header>

    <div class="content">
      <div class="control-panel">
        <h2>Send a Message</h2>
        <p>Type a message and click send. It will be broadcast to all other tabs (like Domain B) via the iframe bridge below.</p>
        <div class="input-group">
          <input type="text" v-model="message" placeholder="Enter your message..." @keyup.enter="sendMessage" />
          <button @click="sendMessage">Send</button>
        </div>
        <p v-if="sentMessage" class="confirmation-message">
          Sent: <strong>{{ sentMessage }}</strong>
        </p>
      </div>

      <div class="iframe-wrapper">
        <h3>Bridge Iframe</h3>
        <iframe src="/bridge" ref="bridgeIframe" @load="onIframeLoad" loading="lazy"></iframe>
        <p>Status: <span :class="{ 'status-ready': isBridgeReady, 'status-loading': !isBridgeReady }">{{ bridgeStatus }}</span></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello from Domain A!',
      sentMessage: '',
      isBridgeReady: false,
    };
  },
  computed: {
    bridgeStatus() {
      return this.isBridgeReady ? 'Ready' : 'Loading...';
    }
  },
  mounted() {
    // Listen for status updates from the iframe (e.g., to know when it's ready)
    window.addEventListener('message', this.handleIframeMessage);
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
  },
  methods: {
    onIframeLoad() {
      console.log('[Domain A] Bridge iframe has loaded.');
      // The iframe will send a 'ready' message when its own JS has initialized.
    },
    sendMessage() {
      if (!this.message.trim()) {
        alert('Please enter a message.');
        return;
      }
      if (!this.isBridgeReady) {
        alert('Bridge is not ready yet. Please wait a moment.');
        return;
      }

      const iframe = this.$refs.bridgeIframe;
      const messagePayload = {
        text: this.message,
        timestamp: new Date().toISOString(),
      };

      // Send the message to the iframe
      iframe.contentWindow.postMessage({
        source: 'domain-app',
        payload: messagePayload
      }, '*'); // Use specific origin in production

      console.log('[Domain A] Sent message to bridge iframe:', messagePayload);
      this.sentMessage = this.message;
      this.message = '';
    },
    handleIframeMessage(event) {
      // We only care about status messages from the bridge on this page
      const data = event.data;
      if (data && data.source === 'bridge' && data.status === 'ready') {
        this.isBridgeReady = true;
        console.log('[Domain A] Received ready signal from bridge iframe.');
      }
    }
  }
}
</script>

<style scoped>
.domain-container {
  font-family: sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 40px auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}
header {
  border-bottom: 1px solid #ddd;
  padding-bottom: 15px;
  margin-bottom: 20px;
}
h1 {
  margin: 0 0 5px 0;
}
.content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}
.control-panel h2 {
  margin-top: 0;
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
.confirmation-message {
  font-style: italic;
  color: #555;
}
.iframe-wrapper {
  border-top: 1px dashed #ccc;
  padding-top: 20px;
}
iframe {
  width: 100%;
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.status-ready { font-weight: bold; color: #28a745; }
.status-loading { font-style: italic; color: #6c757d; }
</style>
