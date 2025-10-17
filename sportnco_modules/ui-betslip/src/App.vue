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

    <button @click="incrementFromBetslip" class="increment-button">
      Increment from Betslip
    </button>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HelloWorld from './components/HelloWorld.vue'

const count = ref(0);
let socket: WebSocket | null = null;

const incrementFromBetslip = () => {
  const newCount = count.value + 1;
  if (socket) {
    socket.send(newCount.toString());
  }
};

onMounted(() => {
  socket = new WebSocket('ws://localhost:8080');

  socket.addEventListener('open', () => {
    console.log('Betslip component connected to WebSocket');
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
