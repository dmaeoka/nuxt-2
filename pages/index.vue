<template>
  <div class="container">
    <h1>Betting Platform</h1>

    <div class="layout">
      <div class="bets-section">
        <h2>Available Bets</h2>
        <div class="bet-card" v-for="bet in availableBets" :key="bet.id">
          <div class="bet-details">
            <strong>{{ bet.name }}</strong>
            <span class="odds">Odds: {{ bet.odds }}</span>
          </div>
          <button @click="addToBetslip(bet)" class="add-btn">
            Add to Betslip
          </button>
        </div>
        <button class="btn" @click="sendPing">Send Ping</button>
        <p v-if="pingStatus" class="status-message">
          {{ pingStatus }}
        </p>
      </div>
      <div class="betslip-section">
        <client-only>
          <betslip-component :api-url="apiUrl"></betslip-component>
        </client-only>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head() {
    return {
      script: [
        {
          src: '/CrossTabMessenger.js',
          body: true
        }
      ]
    };
  },
  data() {
    return {
      apiUrl: '',
      pingStatus: '',
      availableBets: [
        { id: '1', name: 'Team A to Win', odds: 2.5 },
        { id: '2', name: 'Team B to Win', odds: 1.8 },
        { id: '3', name: 'Draw', odds: 3.2 },
        { id: '4', name: 'Over 2.5 Goals', odds: 1.9 },
        { id: '5', name: 'Under 2.5 Goals', odds: 2.1 }
      ]
    }
  },
  mounted() {
    if (window.CrossTabMessenger) {
      const bridgeUrl = `${window.location.origin}/bridge.html`;
      window.CrossTabMessenger.init(bridgeUrl);

      // Set up ping listener
      window.CrossTabMessenger.onPing(() => {
        this.pingStatus = 'Ping received';
        console.log('[Domain A] Ping received');
      });
    }
  },
  methods: {
    async addToBetslip(bet) {
      console.log('[Index Page] Adding bet to betslip:', bet)
      try {
        const response = await fetch(`${this.apiUrl}/api/betslip/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bet: {
              ...bet,
              stake: 10
            }
          })
        })
        const result = await response.json()
        console.log('[Index Page] ✅ Bet added successfully:', result)
      } catch (error) {
        console.error('[Index Page] ❌ Failed to add bet:', error)
      }
    },
    sendPing() {
      if (window.CrossTabMessenger) {
        window.CrossTabMessenger.ping();
        this.pingStatus = 'Ping sent 🚀';
        console.log('[Domain A] Ping sent');
      } else {
        this.pingStatus = 'CrossTabMessenger not available';
      }
    },
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 32px;
}

.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.bets-section h2 {
  margin-bottom: 16px;
}

.bet-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  background: white;
}

.bet-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.odds {
  color: #666;
  font-size: 14px;
}

.add-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.add-btn:hover {
  background: #2563eb;
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
</style>
