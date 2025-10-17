import { defineCustomElement } from 'vue'
import App from './App.vue'
import mainCss from './assets/main.css?inline'

// Create custom element with injected styles for Shadow DOM
const BetslipComponent = defineCustomElement(App, {
  styles: [mainCss],
})

// Export for use as a library/plugin
export { BetslipComponent }

// Auto-register the custom element when used as a plugin
export function register() {
  if (!customElements.get('betslip-component')) {
    customElements.define('betslip-component', BetslipComponent)
  }
}

// Auto-register if used directly in browser
if (typeof window !== 'undefined') {
  register()
}
