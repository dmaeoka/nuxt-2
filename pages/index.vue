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
  data() {
    return {
      apiUrl: process.env.API_URL || '',
      availableBets: [
        { id: '1', name: 'Team A to Win', odds: 2.5 },
        { id: '2', name: 'Team B to Win', odds: 1.8 },
        { id: '3', name: 'Draw', odds: 3.2 },
        { id: '4', name: 'Over 2.5 Goals', odds: 1.9 },
        { id: '5', name: 'Under 2.5 Goals', odds: 2.1 }
      ]
    }
  },

  methods: {
    async addToBetslip(bet) {
      try {
        await fetch(`${this.apiUrl}/api/betslip/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bet: {
              ...bet,
              stake: 10 // Default stake
            }
          })
        })
      } catch (error) {
        console.error('Failed to add bet:', error)
      }
    }
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
</style>
