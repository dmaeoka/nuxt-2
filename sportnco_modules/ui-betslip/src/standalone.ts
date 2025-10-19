import './assets/main.css'
import mainCss from './assets/main.css?inline'
import { createApp, defineCustomElement } from 'vue'
import App from './App.vue'

// Create custom element with injected styles for Shadow DOM
const BetslipComponent = defineCustomElement(App, {
  styles: [mainCss],
})

// Register the custom element
if (!customElements.get('betslip-component')) {
  customElements.define('betslip-component', BetslipComponent)
}

// Auto-mount if there's a #betslip element
if (typeof window !== 'undefined') {
  const mountElement = document.getElementById('betslip')
  if (mountElement) {
    const props = {
      apiUrl: mountElement.getAttribute('data-api-url') || ''
    }
    const app = createApp(App, props)
    app.mount('#betslip')
  }
}

// Expose a global mount function for manual initialization
if (typeof window !== 'undefined') {
  ;(window as any).UiBetslip = {
    mount(selector: string, props?: Record<string, any>) {
      const element = document.querySelector(selector)
      if (element) {
        const app = createApp(App, props)
        app.mount(element)
      }
    },
    BetslipComponent,
  }
}
