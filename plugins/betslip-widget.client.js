export default () => {
  if (process.client) {
    try {
      // Load the standalone build which includes Vue 3 bundled
      // Import as raw file paths since ui-betslip is not a dependency
      require('~/sportnco_modules/ui-betslip/dist/standalone/ui-betslip-standalone.iife.js')
      require('~/sportnco_modules/ui-betslip/dist/standalone/ui-betslip-standalone.css')

      console.log('Betslip standalone bundle loaded successfully')
      // The custom element is auto-registered by the standalone bundle
    } catch (error) {
      console.error('Failed to load betslip widget:', error)
    }
  }
}
