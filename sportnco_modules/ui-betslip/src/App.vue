<template>
  <main class="bg-gray-200 p-4 lg:p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-purple-700">Domain B (Receiver)</h1>

      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Cross-Tab Ping Test</h2>
        <button
          @click="sendPing"
          class="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          Send Ping
        </button>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Betslip Development Preview</h2>
        <BetslipComponent :api-url="apiUrl" :ping="status" />
      </div>
    </div>
  </main>
</template>

<style scoped></style>

<script setup lang="ts">
  interface CrossTabMessenger {
    init: (bridgeUrl: string) => void;
    ping: () => void;
    pong: () => void;
    onPing: (callback: () => void) => void;
    onPong: (callback: (origin: string) => void) => void;
  }

  declare global {
    interface Window {
      CrossTabMessenger: CrossTabMessenger | undefined;
    }
  }

  import { ref, onMounted } from 'vue'
  import BetslipComponent from './components/BetslipComponent.vue'

  const props = defineProps<{
    apiUrl?: string
    ping?: string
  }>()

  const apiUrl = props.apiUrl || import.meta.env.VITE_API_URL || ''
  const status = ref('')

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

      window.CrossTabMessenger.onPing(() => {
        status.value = 'Ping received'
        console.log('[Domain B] Ping received')
      })
    }
  }

  function sendPing() {
    if (window.CrossTabMessenger) {
      window.CrossTabMessenger.ping()
      status.value = 'Ping sent 🚀'
      console.log('[Domain B] Ping sent')
    } else {
      status.value = 'CrossTabMessenger not available'
    }
  }
</script>
