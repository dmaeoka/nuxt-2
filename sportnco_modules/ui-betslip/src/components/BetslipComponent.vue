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
    <div v-else class="space-y-2 text-gray-600">

      <div v-for="bet in betslip.bets" :key="bet.id" class="p-3 border border-gray-100 rounded-md mb-2 bg-gray-50">
        <div class="flex justify-between mb-2">
          <span class="font-medium">{{ bet.name }}</span>
          <span class="text-gray-600 text-sm">@ {{ bet.odds }}</span>
        </div>
        <div class="flex gap-2 items-center">
          <input
            type="number"
            :value="bet.stake"
            @input="updateStake(bet.id, parseFloat(($event.target as HTMLInputElement)?.value) || 0)"
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

    <button @click="count++">You clicked me {{ count }} times.</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Bet {
  id: string
  name: string
  odds: number
  stake: number
}

interface BetslipState {
  bets: Bet[]
  totalStake: number
  potentialWin: number
}

const props = defineProps({
  apiUrl: {
    type: String,
    default: ''
  }
})

const betslip = ref<BetslipState>({
  bets: [],
  totalStake: 0,
  potentialWin: 0
})

const count = ref(0)
const isConnected = ref(false)
const isSubmitting = ref(false)

let eventSource: EventSource | null = null

const connectToBetslip = () => {
  try {
    const streamUrl = `${props.apiUrl}/api/betslip/stream`
    console.log('[Betslip] 🔌 Attempting to connect to SSE stream...')
    console.log('[Betslip] Stream URL:', streamUrl)
    console.log('[Betslip] apiUrl prop value:', JSON.stringify(props.apiUrl))
    console.log('[Betslip] Full constructed URL:', window.location.origin + streamUrl)

    eventSource = new EventSource(streamUrl)
    console.log('[Betslip] EventSource object created:', eventSource)
    console.log('[Betslip] Initial readyState:', eventSource.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSED)')

    eventSource.addEventListener('open', () => {
      isConnected.value = true
      console.log('[Betslip] ✅ [open event] Connection established!')
      console.log('[Betslip] ReadyState after open:', eventSource?.readyState)
    })

    eventSource.addEventListener('message', (event) => {
      console.log('[Betslip] 📨 [message event] Received!')
      console.log('[Betslip] Event:', event)
      console.log('[Betslip] Data:', event.data)

      try {
        const newState = JSON.parse(event.data)
        console.log('[Betslip] ✅ Parsed state:', JSON.stringify(newState, null, 2))
        betslip.value = newState
        console.log('[Betslip] ✅ Updated betslip.value')
      } catch (error) {
        console.error('[Betslip] ❌ Parse error:', error)
      }
    })

    eventSource.addEventListener('error', (error) => {
      console.error('[Betslip] ❌ [error event] SSE error:', error)
      console.error('[Betslip] EventSource readyState:', eventSource?.readyState)
      console.error('[Betslip] EventSource url:', eventSource?.url)

      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        console.log('[Betslip] Connection closed, will attempt reconnect...')
        isConnected.value = false
        setTimeout(() => {
          console.log('[Betslip] 🔄 Attempting reconnection...')
          connectToBetslip()
        }, 3000)
      }
    })

    // Log any other event types we might receive
    console.log('[Betslip] EventSource created, readyState:', eventSource.readyState)
  } catch (error) {
    console.error('[Betslip] Failed to create EventSource:', error)
  }
}

const removeBet = async (betId: string) => {
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

const updateStake = async (betId: string, stake: number) => {
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
  addBet: async (bet: Bet) => {
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

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close()
  }
})
</script>
