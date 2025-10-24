<template>
  <div class="border border-gray-200 rounded-lg p-4 bg-white font-sans max-w-md">
    <div class="mb-4">
      <h3 class="text-lg font-semibold m-0">Betslip ({{ betslip.bets.length }})</h3>
    </div>
    <div v-if="betslip.bets.length === 0" class="py-8 px-4 text-center text-gray-600">
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
          <button @click="() => removeBet(bet.id)" class="w-8 h-8 border-none bg-red-500 text-white rounded cursor-pointer text-xl leading-none p-0 hover:bg-red-700 transition-colors">×</button>
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
        <button @click="() => clearBetslip()" class="flex-1 py-3 border border-gray-300 rounded-md text-sm font-semibold cursor-pointer transition-all bg-white text-gray-600 hover:bg-gray-50">Clear All</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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
  ping: {
    type: String,
    default: ''
  }
})

const betslip = ref<BetslipState>({
  bets: [],
  totalStake: 0,
  potentialWin: 0
})
const status = ref(props.ping)
const isSubmitting = ref(false)

// Watch for changes in the ping prop and update status
watch(() => props.ping, (newPing) => {
  status.value = newPing
})

// Calculate totals whenever bets change
const calculateTotals = () => {
  betslip.value.totalStake = betslip.value.bets.reduce((sum, bet) => sum + bet.stake, 0)
  betslip.value.potentialWin = betslip.value.bets.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0)
}

// Add a bet to the betslip
const addBet = (bet: Bet) => {
  try {
    // Check if bet already exists
    const existingBet = betslip.value.bets.find(b => b.id === bet.id)

    if (existingBet) {
      // Update stake if bet already exists
      existingBet.stake += bet.stake
      console.log('[Betslip] Bet already exists, increased stake:', existingBet)
    } else {
      // Add new bet
      betslip.value.bets.push({ ...bet })
      console.log('[Betslip] Bet added:', bet)
    }

    calculateTotals()
    status.value = `Added ${bet.name} to betslip`

    // Clear status after 2 seconds
    setTimeout(() => {
      status.value = ''
    }, 2000)
  } catch (error) {
    console.error('[Betslip] Failed to add bet:', error)
  }
}

// Update stake for a specific bet
const updateStake = (betId: string, stake: number, skipEmit: boolean = false) => {
  try {
    const bet = betslip.value.bets.find(b => b.id === betId)

    if (bet) {
      bet.stake = stake
      calculateTotals()
      console.log('[Betslip] Stake updated for bet:', betId, 'new stake:', stake)

      // Only emit event if not from external source (to prevent circular loop)
      if (!skipEmit) {
        window.dispatchEvent(new CustomEvent('betslip:updateStake', {
          detail: { betId, stake }
        }))
      }
    }
  } catch (error) {
    console.error('[Betslip] Failed to update stake:', error)
  }
}

// Remove a bet from the betslip
const removeBet = (betId: string, skipEmit: boolean = false) => {
  try {
    const index = betslip.value.bets.findIndex(b => b.id === betId)

    if (index !== -1) {
      const removedBet = betslip.value.bets.splice(index, 1)[0]
      calculateTotals()
      console.log('[Betslip] Bet removed:', removedBet)

      if (removedBet) {
        status.value = `Removed ${removedBet.name} from betslip`
        setTimeout(() => {
          status.value = ''
        }, 2000)

        // Only emit event if not from external source (to prevent circular loop)
        if (!skipEmit) {
          window.dispatchEvent(new CustomEvent('betslip:removeBet', {
            detail: { betId }
          }))
        }
      }
    }
  } catch (error) {
    console.error('[Betslip] Failed to remove bet:', error)
  }
}

// Submit the betslip
const submitBetslip = () => {
  if (betslip.value.bets.length === 0) return

  isSubmitting.value = true

  try {
    console.log('[Betslip] Submitting betslip:', betslip.value)

    // Simulate submission delay
    setTimeout(() => {
      status.value = `Betslip submitted successfully! Total stake: $${betslip.value.totalStake.toFixed(2)}, Potential win: $${betslip.value.potentialWin.toFixed(2)} ✅`

      // Emit event to parent before clearing
      window.dispatchEvent(new CustomEvent('betslip:submit', {
        detail: { betslip: { ...betslip.value } }
      }))

      // Clear betslip after submission
      betslip.value.bets = []
      calculateTotals()
      isSubmitting.value = false

      // Clear status after 5 seconds
      setTimeout(() => {
        status.value = ''
      }, 5000)
    }, 500)
  } catch (error) {
    console.error('[Betslip] Failed to submit betslip:', error)
    status.value = 'Failed to submit betslip ❌'
    isSubmitting.value = false

    setTimeout(() => {
      status.value = ''
    }, 3000)
  }
}

// Clear all bets from the betslip
const clearBetslip = (skipEmit: boolean = false) => {
  try {
    betslip.value.bets = []
    calculateTotals()
    console.log('[Betslip] Betslip cleared')

    status.value = 'Betslip cleared'
    setTimeout(() => {
      status.value = ''
    }, 2000)

    // Only emit event if not from external source (to prevent circular loop)
    if (!skipEmit) {
      window.dispatchEvent(new CustomEvent('betslip:clear', {
        detail: {}
      }))
    }
  } catch (error) {
    console.error('[Betslip] Failed to clear betslip:', error)
  }
}

// Expose methods so parent can call them
defineExpose({
  addBet,
  removeBet,
  updateStake,
  submitBetslip,
  clearBetslip
})
</script>
