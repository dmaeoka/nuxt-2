import { defineCustomElement } from 'vue'
import BetslipComponent from './components/BetslipComponent.vue'
import mainCss from './assets/main.css?inline'

// Define the custom element with injected styles
// The styles will be added to the Shadow DOM of each custom element instance
const BetslipCustomElement = defineCustomElement(BetslipComponent, {
  styles: [mainCss],
})

// Export for registration
export { BetslipCustomElement }

// Auto-register if running in browser
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  customElements.define('betslip-component', BetslipCustomElement)
}
