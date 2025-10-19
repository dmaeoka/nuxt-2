<template>
  <main class="bg-black p-4 lg:p-8 text-white">

    <HelloWorld msg="Welcome to Your Nuxt Sportnco Betslip Module!" />

    <div class="mb-4 p-4 bg-gray-800 rounded-lg">
      <p class="text-xl">
        Count from Test.vue: <strong class="text-green-400">{{ count ?? 0 }}</strong>
      </p>
    </div>

    <button @click="incrementFromBetslip" :disabled="!isSocketReady" class="increment-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Increment from Betslip
    </button>
  </main>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import HelloWorld from './components/HelloWorld.vue'

  const props = defineProps<{
    wsUrl?: string
  }>()

  const count = ref(0);
  const isSocketReady = ref(false);
  let socket: WebSocket | null = null;

  const incrementFromBetslip = () => {
    const newCount = count.value + 1;
    if (socket) {
      socket.send(newCount.toString());
    }
  };

  onMounted(() => {
    const finalWsUrl = props.wsUrl || import.meta.env.VITE_WS_URL;

    if (finalWsUrl) {
      console.log(`Connecting to WebSocket at ${finalWsUrl}`);
      socket = new WebSocket(finalWsUrl);

      socket.addEventListener('open', () => {
        console.log(`Betslip component connected to WebSocket at ${finalWsUrl}`);
        isSocketReady.value = true;
      });

      socket.addEventListener('close', () => {
        console.log('Betslip component disconnected from WebSocket');
        isSocketReady.value = false;
      });

      socket.addEventListener('message', (event) => {
        const newCount = parseInt(event.data, 10);
        if (!isNaN(newCount)) {
          count.value = newCount;
        }
      });
    } else {
      console.error('Error: WebSocket URL is not defined. Please provide it via the "ws-url" attribute or set the VITE_WS_URL environment variable.');
    }
  });

  onUnmounted(() => {
    if (socket) {
      socket.close();
    }
  });
</script>

<style scoped>
header {
  line-height: 1.5;
}
</style>
