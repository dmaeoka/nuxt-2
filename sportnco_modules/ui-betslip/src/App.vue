<template>
  <main class="bg-gray-200 p-4 lg:p-8">
    <h1 class="text-2xl font-bold mb-4">Betslip Development Preview</h1>
    <BetslipComponent :api-url="apiUrl" />
  </main>
</template>

<style scoped></style>

<script setup lang="ts">
  import BetslipComponent from './components/BetslipComponent.vue'

  const props = defineProps<{
    apiUrl?: string
  }>()

  const apiUrl = props.apiUrl || import.meta.env.VITE_API_URL || ''
</script>
