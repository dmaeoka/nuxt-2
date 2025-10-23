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
  })

  function initCrossTabMessenger() {
    if (window.CrossTabMessenger) {
      window.CrossTabMessenger.init('http://192.168.112.156:5000/bridge.html')

      // Listen for ping messages
      window.CrossTabMessenger.onPing(() => {
        status.value = 'Ping received'
        console.log('[Domain B] Ping received')
      })

      // Listen for addBet messages from the bridge
      if (window.CrossTabMessenger.onMessage) {
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
