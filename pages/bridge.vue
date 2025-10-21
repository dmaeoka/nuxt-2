<template>
  <div class="bridge-container">
    <p>This is the Bridge iframe.</p>
    <p>Status: <span :class="{ 'status-connected': isConnected, 'status-disconnected': !isConnected }">{{ status }}</span></p>
    <div v-if="lastMessage" class="message-log">
      <strong>Last broadcast sent:</strong>
      <pre>{{ lastMessage }}</pre>
    </div>
  </div>
</template>

<script>
export default {
  layout: 'empty', // Use a layout without the default nav/footer
  data() {
    return {
      channel: null,
      status: 'Initializing...',
      isConnected: false,
      lastMessage: null,
    };
  },
  mounted() {
    try {
      // 1. Create or join the Broadcast Channel.
      this.channel = new BroadcastChannel('cross_domain_bridge_channel');
      this.status = 'Connected';
      this.isConnected = true;
      console.log('[Bridge] BroadcastChannel connected.');

      // 2. Listen for messages from other bridge iframes.
      this.channel.onmessage = this.handleChannelMessage;

      // 3. Listen for messages from the parent window.
      window.addEventListener('message', this.handleParentMessage);

      // Notify parent that the bridge is ready
      window.parent.postMessage({ source: 'bridge', status: 'ready' }, '*');

    } catch (error) {
      this.status = 'Failed to initialize';
      this.isConnected = false;
      console.error('[Bridge] Error initializing BroadcastChannel:', error);
    }
  },
  beforeDestroy() {
    // Clean up listeners and close the channel
    if (this.channel) {
      this.channel.close();
      console.log('[Bridge] BroadcastChannel closed.');
    }
    window.removeEventListener('message', this.handleParentMessage);
  },
  methods: {
    /**
     * Handles messages received from the PARENT window (e.g., domain-a.vue).
     * It then broadcasts this message to all other bridge iframes.
     */
    handleParentMessage(event) {
      // Basic security: you might want to check event.origin against a whitelist
      // For this demo, we allow any origin to post to the bridge.
      const data = event.data;

      // Ignore messages that aren't from our parent apps
      if (!data || data.source !== 'domain-app') {
        return;
      }

      console.log('[Bridge] Received message from parent:', data);
      this.lastMessage = data;

      // Broadcast the message payload over the channel
      if (this.channel) {
        this.channel.postMessage(data.payload);
        console.log('[Bridge] Broadcasted message to channel:', data.payload);
      }
    },

    /**
     * Handles messages received from the BROADCAST CHANNEL (from other bridge iframes).
     * It then posts this message up to its own parent window.
     */
    handleChannelMessage(event) {
      const messagePayload = event.data;
      console.log('[Bridge] Received message from channel:', messagePayload);

      // Send the message up to the parent window (e.g., domain-b.vue)
      // The '*' target origin is insecure for production, but fine for this demo.
      // In a real app, you'd specify the parent's exact origin.
      window.parent.postMessage({
        source: 'bridge-broadcast',
        payload: messagePayload
      }, '*');

      console.log('[Bridge] Sent message to parent window.');
    }
  }
}
</script>

<style scoped>
.bridge-container {
  font-family: sans-serif;
  padding: 10px;
  background-color: #f0f8ff;
  border: 1px solid #add8e6;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
}
.status-connected {
  font-weight: bold;
  color: #28a745;
}
.status-disconnected {
  font-weight: bold;
  color: #dc3545;
}
.message-log {
  margin-top: 10px;
  padding: 8px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}
pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
