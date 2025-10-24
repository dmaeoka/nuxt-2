<template>
  <main class="bg-gray-200 p-4 lg:p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-purple-700">Domain B (Receiver)</h1>

      <!-- Status Display -->
      <div v-if="status" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <p class="font-bold">{{ status }}</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Betslip Development Preview</h2>
        <BetslipComponent ref="betslipRef" :api-url="apiUrl" :ping="receivedMessage" />
      </div>
    </div>
  </main>
</template>

<style scoped></style>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import BetslipComponent from './components/BetslipComponent.vue'

  const props = defineProps<{
    apiUrl?: string
    ping?: string
  }>()

  const apiUrl = props.apiUrl || import.meta.env.VITE_API_URL || ''
  const status = ref('')
  const receivedMessage = ref('')
  const betslipRef = ref<InstanceType<typeof BetslipComponent> | null>(null)

  onMounted(() => {
    // Load CrossTabMessenger script dynamically
    const bridgeServer = 'http://192.168.112.156:5000'
    const script = document.createElement('script')
    script.src = `${bridgeServer}/CrossTabMessenger.js`
    script.onload = () => initCrossTabMessenger(bridgeServer)
    document.body.appendChild(script)

    // Listen for betslip component events and broadcast through bridge
    window.addEventListener('betslip:updateStake', (e: any) => {
      console.log('[Domain B] betslip:updateStake event:', e.detail)
      if (window.CrossTabMessenger) {
        window.CrossTabMessenger.postToBridge({ type: 'updateStake', data: e.detail })
      }
    })

    window.addEventListener('betslip:removeBet', (e: any) => {
      console.log('[Domain B] betslip:removeBet event:', e.detail)
      if (window.CrossTabMessenger) {
        window.CrossTabMessenger.postToBridge({ type: 'removeBet', data: e.detail })
      }
    })

    window.addEventListener('betslip:submit', (e: any) => {
      console.log('[Domain B] betslip:submit event:', e.detail)
      if (window.CrossTabMessenger) {
        window.CrossTabMessenger.postToBridge({ type: 'submitBetslip', data: e.detail })
      }
    })

    window.addEventListener('betslip:clear', (e: any) => {
      console.log('[Domain B] betslip:clear event:', e.detail)
      if (window.CrossTabMessenger) {
        window.CrossTabMessenger.postToBridge({ type: 'clearBetslip', data: e.detail })
      }
    })
  })

  function initCrossTabMessenger(bridgeServer: string) {
    if (window.CrossTabMessenger) {
      window.CrossTabMessenger.init(`${bridgeServer}/bridge.html`)
      console.log('[Domain B] Bridge initialized with server:', bridgeServer)

      // Listen for ping messages
      window.CrossTabMessenger.onPing(() => {
        status.value = 'Ping received from Domain A! 📨'
        console.log('[Domain B] Ping received')

        // Auto-clear status after 3 seconds
        setTimeout(() => {
          status.value = ''
        }, 3000)
      })

      // Listen for betslip messages from the bridge
      if (window.CrossTabMessenger.onMessage) {
        // addBet
        window.CrossTabMessenger.onMessage('addBet', (data: unknown) => {
          console.log('[Domain B] addBet message received:', data)
          const betData = data as { bet?: { id: string; name: string; odds: number; stake: number } }
          if (betslipRef.value && betData?.bet) {
            betslipRef.value.addBet(betData.bet)
            status.value = `Added ${betData.bet.name} from bridge! 🎯`
            setTimeout(() => {
              status.value = ''
            }, 6000)
          }
        })

        // updateStake
        window.CrossTabMessenger.onMessage('updateStake', (data: unknown) => {
          console.log('[Domain B] updateStake message received:', data)
          const stakeData = data as { betId?: string; stake?: number }
          if (betslipRef.value && stakeData?.betId && stakeData?.stake !== undefined) {
            // Pass skipEmit=true to prevent circular loop
            betslipRef.value.updateStake(stakeData.betId, stakeData.stake, true)
            console.log('[Domain B] Stake updated from bridge')
          }
        })

        // removeBet
        window.CrossTabMessenger.onMessage('removeBet', (data: unknown) => {
          console.log('[Domain B] removeBet message received:', data)
          const removeData = data as { betId?: string }
          if (betslipRef.value && removeData?.betId) {
            // Pass skipEmit=true to prevent circular loop
            betslipRef.value.removeBet(removeData.betId, true)
            console.log('[Domain B] Bet removed from bridge')
          }
        })

        // submitBetslip
        window.CrossTabMessenger.onMessage('submitBetslip', (data: unknown) => {
          console.log('[Domain B] submitBetslip message received:', data)
          if (betslipRef.value) {
            betslipRef.value.submitBetslip()
            console.log('[Domain B] Betslip submitted from bridge')
          }
        })

        // clearBetslip
        window.CrossTabMessenger.onMessage('clearBetslip', (data: unknown) => {
          console.log('[Domain B] clearBetslip message received:', data)
          if (betslipRef.value) {
            // Pass skipEmit=true to prevent circular loop
            betslipRef.value.clearBetslip(true)
            console.log('[Domain B] Betslip cleared from bridge')
          }
        })

        // Listen for custom messages
        window.CrossTabMessenger.onMessage('customMessage', (data: unknown) => {
          receivedMessage.value = JSON.stringify(data, null, 2)
          status.value = 'Object received! 📦'
          console.log('[Domain B] Custom message received:', data)
        })
      }

      console.log('[Domain B] CrossTabMessenger initialized and listeners registered')
    }
  }
</script>
