import { ref } from 'vue'

export function useBetslip() {
  const bets = ref([
    { id: 1, name: 'Bet 1' },
    { id: 2, name: 'Bet 2' }
  ])

  function addBet() {
    // Placeholder function
  }

  function removeBet() {
    // Placeholder function
  }

  return {
    bets,
    addBet,
    removeBet
  }
}
