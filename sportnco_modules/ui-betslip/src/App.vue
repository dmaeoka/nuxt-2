<template>
  <main class="bg-black p-4 lg:p-8 text-white">
    <h1 class="text-2xl font-bold mb-4">Betslip Development Preview</h1>

    <BetslipComponent :api-url="apiUrl" />
  </main>
</template>

<script setup lang="ts">
  import BetslipComponent from './components/BetslipComponent.ce.vue'

  const props = defineProps<{
    apiUrl?: string
  }>()

  const apiUrl = props.apiUrl || import.meta.env.VITE_API_URL || ''
</script>

<style scoped>
header {
  line-height: 1.5;
}
</style>
