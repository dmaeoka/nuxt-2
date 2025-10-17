<template>
  <main class="bg-black p-4 lg:p-8 text-white">
    <header class="text-3xl font-bold mb-8">
      Nuxt Sportnco Betslip Module
    </header>

    <!-- Display the count value -->
    <div class="mb-4 p-4 bg-gray-800 rounded-lg">
      <p class="text-xl">
        Count from Test.vue: <strong class="text-green-400">{{ count ?? 0 }}</strong>
      </p>
    </div>

    <HelloWorld msg="Welcome to Your Nuxt Sportnco Betslip Module!" />

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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const finalWsUrl = props.wsUrl || `${protocol}//localhost:3000`;
    console.log(props.wsUrl)

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
