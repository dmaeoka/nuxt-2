// composables/useBetslip.js or mixins/betslip.js
export default {
  data() {
    return {
      betslip: {
        bets: [],
        totalStake: 0,
        potentialWin: 0
      },
      eventSource: null
    }
  },

  mounted() {
    this.connectToBetslip()
  },

  beforeDestroy() {
    if (this.eventSource) {
      this.eventSource.close()
    }
  },

  methods: {
    connectToBetslip() {
      // Connect to SSE stream
      this.eventSource = new EventSource('https://your-nuxt-domain.com/api/betslip/stream')

      this.eventSource.onmessage = (event) => {
        const newState = JSON.parse(event.data)
        this.betslip = newState
      }

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        // Reconnect logic
        setTimeout(() => {
          this.connectToBetslip()
        }, 3000)
      }
    },

    async addBet(bet) {
      await fetch('https://your-nuxt-domain.com/api/betslip/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet })
      })
    },

    async removeBet(betId) {
      await fetch('https://your-nuxt-domain.com/api/betslip/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId })
      })
    },

    async updateStake(betId, stake) {
      await fetch('https://your-nuxt-domain.com/api/betslip/update-stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, stake })
      })
    },

    async submitBetslip() {
      const response = await fetch('https://your-nuxt-domain.com/api/betslip/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.betslip)
      })

      if (response.ok) {
        // Clear betslip after successful submission
        await this.clearBetslip()
      }
    },

    async clearBetslip() {
      await fetch('https://your-nuxt-domain.com/api/betslip/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
