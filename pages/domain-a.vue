<template>
  <div class="domain-container">
    <header>
      <h1>Domain A (Sender)</h1>
      <p>This page simulates a domain that sends messages across tabs.</p>
    </header>

    <div class="content">
      <div class="control-panel">
        <h2>Cross-Tab Ping Test</h2>
        <p>Send a ping to other tabs and receive pong responses.</p>
        <div>
          <button class="btn" @click="sendCustomMessage">Send Custom Message</button>
        </div>
        <p v-if="pingStatus" class="status-message">
          {{ pingStatus }}
        </p>
        <p v-if="receivedMessage" class="status-message">
          Received: {{ receivedMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      pingStatus: '',
      receivedMessage: '',
    };
  },
  mounted() {
    // Listen for ping messages from other tabs/domains
    if (this.$SncWorker) {
      this.$SncWorker.onPing(() => {
        this.pingStatus = 'Ping received from other tab! 📨';
      });

      // Listen for custom messages
      this.$SncWorker.onMessage('customMessage', (data) => {
        this.receivedMessage = JSON.stringify(data);
        console.log('[Domain A] Custom message received:', data);
      });
    }
  },
  methods: {
    sendPing() {
      if (this.$SncWorker) {
        this.$SncWorker.ping();
        this.pingStatus = 'Ping sent 🚀';
        console.log('[Nuxt] Ping sent');
      } else {
        this.pingStatus = 'CrossTabMessenger not available';
      }
    },
    sendCustomMessage() {
      if (this.$SncWorker) {
        const messageData = {
          user: 'Domain A',
          message: 'Hello from cross-tab!',
          timestamp: Date.now(),
          nested: {
            foo: 'bar',
            array: [1, 2, 3]
          }
        };
        this.$SncWorker.sendObject('customMessage', messageData);
        this.pingStatus = 'Custom message sent! 📤';
        console.log('[Domain A] Sent custom message:', messageData);
      } else {
        this.pingStatus = 'CrossTabMessenger not available';
      }
    },
  }
}
</script>

<style scoped>
header {
  text-align: center;
}

header h1 {
  margin: 0 0 0.5rem 0;
  color: #667eea;
  font-size: 2.5rem;
  font-weight: 700;
}

header p {
  margin: 0;
  color: #64748b;
  font-size: 1.1rem;
}

.content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.control-panel {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.control-panel h2 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
}

.control-panel p {
  margin: 0 0 1.5rem 0;
  color: #64748b;
  line-height: 1.6;
}

button.btn {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  white-space: nowrap;
}

button.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

button.btn:active {
  transform: translateY(0);
}

.status-message {
  margin: 0;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-left: 4px solid #667eea;
  border-radius: 6px;
  color: #1e293b;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
