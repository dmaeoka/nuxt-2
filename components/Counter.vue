<template>
  <div class="counter-card">
    <!-- Display the current count -->
    <p class="count-display">Current Count: <strong>{{ count }}</strong></p>

    <!-- Button to increment the count -->
    <button @click="increment" class="increment-button">
      Click Me!
    </button>

    <!-- Button to reset the count -->
    <button @click="reset" class="reset-button">
      Reset
    </button>
  </div>
</template>

<script setup>
// 1. Import 'ref' from Vue to create a reactive state variable
import { ref } from 'vue';

const count = ref(0);

// 2. Define reactive state
// 'count' holds the current value of the counter.
const emit = defineEmits(['increment']);

const increment = () => {
  emit('increment');
  count.value += 1;
};

// Function to reset the counter
const reset = () => {
  count.value = 0;
};
</script>

<style scoped>
.counter-card {
  font-family: Arial, sans-serif;
  max-width: 400px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}

.count-display {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
}

.increment-button, .reset-button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease-in-out;
}

.increment-button {
  background-color: #42b883; /* Vue Green */
  color: white;
}

.increment-button:hover {
  background-color: #33a06f;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(66, 184, 131, 0.4);
}

.reset-button {
  background-color: #e74c3c; /* Red */
  color: white;
}

.reset-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(231, 76, 60, 0.4);
}
</style>
