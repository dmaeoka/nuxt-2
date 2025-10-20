import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const isStandalone = process.env.BUILD_MODE === 'standalone'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue({
      customElement: true,
    }),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isStandalone ? 'production' : process.env.NODE_ENV || 'production'),
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/custom-element.ts', import.meta.url)),
      name: 'BetslipWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `betslip-widget.${format}.js`
    },
    cssCodeSplit: false
  }
})
