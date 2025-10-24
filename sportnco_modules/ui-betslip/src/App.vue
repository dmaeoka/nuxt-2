<template>
  <main class="bg-gray-200 p-4 lg:p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-purple-700">Domain B (Receiver)</h1>

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
    const script = document.createElement('script')
    script.src = 'http://192.168.112.156:5000/CrossTabMessenger.js'
    script.onload = () => initCrossTabMessenger()
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

  function initCrossTabMessenger() {
    if (window.CrossTabMessenger) {
      window.CrossTabMessenger.init('http://192.168.112.156:5000/bridge.html')

      // Listen for ping messages
      window.CrossTabMessenger.onPing(() => {
        status.value = 'Ping received'
        console.log('[Domain B] Ping received')
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
            }, 2000)
          }
        })

        // updateStake
        window.CrossTabMessenger.onMessage('updateStake', (data: unknown) => {
          console.log('[Domain B] updateStake message received:', data)
          const stakeData = data as { betId?: string; stake?: number }
          if (betslipRef.value && stakeData?.betId && stakeData?.stake !== undefined) {
            betslipRef.value.updateStake(stakeData.betId, stakeData.stake)
            console.log('[Domain B] Stake updated from bridge')
          }
        })

        // removeBet
        window.CrossTabMessenger.onMessage('removeBet', (data: unknown) => {
          console.log('[Domain B] removeBet message received:', data)
          const removeData = data as { betId?: string }
          if (betslipRef.value && removeData?.betId) {
            betslipRef.value.removeBet(removeData.betId)
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
            betslipRef.value.clearBetslip()
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
