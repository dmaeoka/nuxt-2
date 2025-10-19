<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-white font-sans max-w-md">
    <div class="mb-4">
      <h3 class="text-lg font-semibold m-0">Betslip ({{ betslip.bets.length }})</h3>
    </div>

    <div v-if="!isConnected" class="py-8 px-4 text-center text-gray-600">
      Connecting...
    </div>

    <div v-else-if="betslip.bets.length === 0" class="py-8 px-4 text-center text-gray-600">
      No bets added yet
    </div>

    <div v-else class="space-y-2">
      <div v-for="bet in betslip.bets" :key="bet.id" class="p-3 border border-gray-100 rounded-md mb-2 bg-gray-50">
        <div class="flex justify-between mb-2">
          <span class="font-medium">{{ bet.name }}</span>
          <span class="text-gray-600 text-sm">@ {{ bet.odds }}</span>
        </div>
        <div class="flex gap-2 items-center">
          <input
            type="number"
            :value="bet.stake"
            @input="updateStake(bet.id, parseFloat($event.target.value) || 0)"
            class="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            min="0"
            step="0.01"
          />
          <button @click="removeBet(bet.id)" class="w-8 h-8 border-none bg-red-500 text-white rounded cursor-pointer text-xl leading-none p-0 hover:bg-red-700 transition-colors">×</button>
        </div>
      </div>

      <div class="my-4 p-3 bg-gray-100 rounded-md">
        <div class="flex justify-between mb-2">
          <span>Total Stake:</span>
          <span class="font-semibold">${{ betslip.totalStake.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Potential Win:</span>
          <span class="font-semibold text-green-600 text-lg">${{ betslip.potentialWin.toFixed(2) }}</span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="submitBetslip"
          :disabled="betslip.bets.length === 0 || isSubmitting"
          class="flex-1 py-3 border-none rounded-md text-sm font-semibold cursor-pointer transition-all bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Submitting...' : 'Place Bet' }}
        </button>
        <button @click="clearBetslip" class="flex-1 py-3 border border-gray-300 rounded-md text-sm font-semibold cursor-pointer transition-all bg-white text-gray-600 hover:bg-gray-50">Clear All</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  apiUrl: {
    type: String,
    default: 'http://localhost:3000'
  }
})

const betslip = ref({
  bets: [],
  totalStake: 0,
  potentialWin: 0
})

const isConnected = ref(false)
const isSubmitting = ref(false)
let eventSource = null

const connectToBetslip = () => {
  try {
    eventSource = new EventSource(`${props.apiUrl}/api/betslip/stream`)

    eventSource.onopen = () => {
      isConnected.value = true
      console.log('Connected to betslip stream')
    }

    eventSource.onmessage = (event) => {
      try {
        const newState = JSON.parse(event.data)
        betslip.value = newState
      } catch (error) {
        console.error('Failed to parse betslip state:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      isConnected.value = false
      eventSource?.close()

      // Reconnect after 3 seconds
      setTimeout(() => {
        connectToBetslip()
      }, 3000)
    }
  } catch (error) {
    console.error('Failed to create EventSource:', error)
  }
}

const removeBet = async (betId) => {
  try {
    await fetch(`${props.apiUrl}/api/betslip/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betId })
    })
  } catch (error) {
    console.error('Failed to remove bet:', error)
  }
}

const updateStake = async (betId, stake) => {
  try {
    await fetch(`${props.apiUrl}/api/betslip/update-stake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betId, stake })
    })
  } catch (error) {
    console.error('Failed to update stake:', error)
  }
}

const submitBetslip = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await fetch(`${props.apiUrl}/api/betslip/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(betslip.value)
    })

    if (response.ok) {
      await clearBetslip()
      alert('Bet placed successfully!')
    } else {
      alert('Failed to place bet')
    }
  } catch (error) {
    console.error('Failed to submit betslip:', error)
    alert('Failed to place bet')
  } finally {
    isSubmitting.value = false
  }
}

const clearBetslip = async () => {
  try {
    await fetch(`${props.apiUrl}/api/betslip/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
  } catch (error) {
    console.error('Failed to clear betslip:', error)
  }
}

// Public API - exposed methods
defineExpose({
  addBet: async (bet) => {
    try {
      await fetch(`${props.apiUrl}/api/betslip/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet })
      })
    } catch (error) {
      console.error('Failed to add bet:', error)
    }
  },
  removeBet,
  updateStake,
  submitBetslip,
  clearBetslip
})

onMounted(() => {
  connectToBetslip()
})

onUnmounted(() => {
  if (eventSource) {
    eventSource.close()
  }
})
</script>

