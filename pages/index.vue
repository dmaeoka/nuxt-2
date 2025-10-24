<template>
  <div class="container">
    <h1>Betting Platform</h1>

    <div class="layout">
      <div class="bets-section">
        <h2>Available Bets</h2>

        <!-- Ping Status Display -->
        <div v-if="pingStatus" class="status-message">
          {{ pingStatus }}
        </div>

        <div class="bet-card" v-for="bet in availableBets" :key="bet.id">
          <div class="bet-details">
            <strong>{{ bet.name }}</strong>
            <span class="odds">Odds: {{ bet.odds }}</span>
          </div>
          <button @click="addToBetslip(bet)" class="btn">
            Add to Betslip
          </button>
        </div>
        <button class="btn ping-btn" @click="sendPing">Send Ping to Domain B</button>
      </div>
      <div class="betslip-section">
        <client-only>
          <betslip-component ref="betslipRef"></betslip-component>
        </client-only>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      bridgeUrl: '',
      pingStatus: '',
      receivedBets: [],
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
    // Listen for ping messages from other tabs/domains
    if (this.$SncWorker) {
      this.$SncWorker.onPing(() => {
        this.pingStatus = 'Ping received from other tab! 📨';
      });

      // Listen for addBet messages from bridge
      this.$SncWorker.onMessage('addBet', (data) => {
        console.log('[Index Page] addBet message received from bridge:', data);
        const betslipComponent = this.$refs.betslipRef;

        if (betslipComponent && betslipComponent.addBet && data?.bet) {
          betslipComponent.addBet(data.bet);
          console.log('[Index Page] Bet added to local betslip from bridge:', data.bet);
        }
      });

      // Listen for updateStake messages from bridge
      this.$SncWorker.onMessage('updateStake', (data) => {
        console.log('[Index Page] updateStake message received from bridge:', data);
        const betslipComponent = this.$refs.betslipRef;

        if (betslipComponent && betslipComponent.updateStake && data?.betId) {
          // Pass skipEmit=true to prevent circular loop
          betslipComponent.updateStake(data.betId, data.stake, true);
          console.log('[Index Page] Stake updated in local betslip from bridge:', data);
        }
      });

      // Listen for removeBet messages from bridge
      this.$SncWorker.onMessage('removeBet', (data) => {
        console.log('[Index Page] removeBet message received from bridge:', data);
        const betslipComponent = this.$refs.betslipRef;

        if (betslipComponent && betslipComponent.removeBet && data?.betId) {
          // Pass skipEmit=true to prevent circular loop
          betslipComponent.removeBet(data.betId, true);
          console.log('[Index Page] Bet removed from local betslip from bridge:', data);
        }
      });

      // Listen for submitBetslip messages from bridge
      this.$SncWorker.onMessage('submitBetslip', (data) => {
        console.log('[Index Page] submitBetslip message received from bridge:', data);
        const betslipComponent = this.$refs.betslipRef;

        if (betslipComponent && betslipComponent.submitBetslip) {
          betslipComponent.submitBetslip();
          console.log('[Index Page] Betslip submitted from bridge');
        }
      });

      // Listen for clearBetslip messages from bridge
      this.$SncWorker.onMessage('clearBetslip', (data) => {
        console.log('[Index Page] clearBetslip message received from bridge:', data);
        const betslipComponent = this.$refs.betslipRef;

        if (betslipComponent && betslipComponent.clearBetslip) {
          // Pass skipEmit=true to prevent circular loop
          betslipComponent.clearBetslip(true);
          console.log('[Index Page] Betslip cleared from bridge');
        }
      });

      // Listen for custom messages
      this.$SncWorker.onMessage('customMessage', (data) => {
        this.receivedMessage = JSON.stringify(data);
        console.log('[Domain A] Custom message received:', data);
      });
    }

    // Listen for betslip component events and broadcast through bridge
    window.addEventListener('betslip:updateStake', (e) => {
      console.log('[Index Page] betslip:updateStake event:', e.detail);
      if (this.$SncWorker) {
        this.$SncWorker.sendObject('updateStake', e.detail);
      }
    });

    window.addEventListener('betslip:removeBet', (e) => {
      console.log('[Index Page] betslip:removeBet event:', e.detail);
      if (this.$SncWorker) {
        this.$SncWorker.sendObject('removeBet', e.detail);
      }
    });

    window.addEventListener('betslip:submit', (e) => {
      console.log('[Index Page] betslip:submit event:', e.detail);
      if (this.$SncWorker) {
        this.$SncWorker.sendObject('submitBetslip', e.detail);
      }
    });

    window.addEventListener('betslip:clear', (e) => {
      console.log('[Index Page] betslip:clear event:', e.detail);
      if (this.$SncWorker) {
        this.$SncWorker.sendObject('clearBetslip', e.detail);
      }
    });
  },
  methods: {
    addToBetslip(bet) {
      console.log('[Index Page] Adding bet to betslip:', bet)

      const betData = {
        id: bet.id,
        name: bet.name,
        odds: bet.odds,
        stake: 10
      }

      // Add to local betslip immediately
      const betslipComponent = this.$refs.betslipRef
      if (betslipComponent && betslipComponent.addBet) {
        betslipComponent.addBet(betData)
        console.log('[Index Page] Bet added to local betslip:', betData)
      }

      // Send bet through the bridge to all other tabs/domains
      if (this.$SncWorker) {
        this.$SncWorker.sendObject('addBet', {
          bet: betData
        })
        console.log('[Index Page] Bet sent through bridge:', betData)
      } else {
        console.warn('[Index Page] SncWorker not available')
      }
    },
    sendPing() {
      if (this.$SncWorker) {
        console.log('[Index Page] Sending ping to other tabs/domains')
        this.$SncWorker.ping()

        // Show feedback
        this.pingStatus = 'Ping sent! 🚀'
        console.log('[Index Page] Ping sent successfully')

        // Clear status after 3 seconds
        setTimeout(() => {
          this.pingStatus = ''
        }, 3000)
      } else {
        this.pingStatus = 'CrossTabMessenger not available ❌'
        setTimeout(() => {
          this.pingStatus = ''
        }, 3000)
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

.btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn:hover {
  background: #2563eb;
}

.ping-btn {
  background: #10b981;
  margin-top: 12px;
}

.ping-btn:hover {
  background: #059669;
}

.status-message {
  padding: 12px;
  background: #dbeafe;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 16px;
  color: #1e40af;
  font-weight: 500;
  text-align: center;
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
