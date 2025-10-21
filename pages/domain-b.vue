<template>
  <div class="domain-container">
    <header>
      <h1>Domain B (Receiver)</h1>
      <p>This page simulates a second domain that listens for messages.</p>
    </header>

    <div class="content">
      <div class="message-display">
        <h2>Received Messages</h2>
        <p>Open Domain A in another tab and send a message. It should appear here.</p>
        <ul v-if="receivedMessages.length > 0">
          <li v-for="(msg, index) in receivedMessages" :key="index">
            <pre>{{ msg }}</pre>
          </li>
        </ul>
        <p v-else class="no-messages">No messages received yet. Waiting...</p>
      </div>

      <div class="iframe-wrapper">
        <h3>Bridge Iframe</h3>
        <iframe src="/bridge" ref="bridgeIframe" loading="lazy"></iframe>
        <p>Status: <span :class="{ 'status-ready': isBridgeReady, 'status-loading': !isBridgeReady }">{{ bridgeStatus }}</span></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      receivedMessages: [],
      isBridgeReady: false,
    };
  },
  computed: {
    bridgeStatus() {
      return this.isBridgeReady ? 'Ready' : 'Loading...';
    }
  },
  mounted() {
    // Listen for messages from our bridge iframe
    window.addEventListener('message', this.handleIframeMessage);
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
  },
  methods: {
    handleIframeMessage(event) {
      const data = event.data;

      // Check if the iframe is signaling that it's ready
      if (data && data.source === 'bridge' && data.status === 'ready') {
        this.isBridgeReady = true;
        console.log('[Domain B] Received ready signal from bridge iframe.');
        return;
      }

      // Check if it's a broadcasted message from the bridge
      if (data && data.source === 'bridge-broadcast') {
        console.log('[Domain B] Received broadcasted message:', data.payload);
        this.receivedMessages.unshift(data.payload);
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
.message-display h2 {
  margin-top: 0;
}
.no-messages {
  font-style: italic;
  color: #666;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}
li {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}
li:last-child {
  border-bottom: none;
}
pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-family: monospace;
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
