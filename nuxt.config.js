// import { defineNuxtConfig } from '@nuxt/bridge'

export default {
  // bridge: true,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Nuxt Starter',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~/plugins/betslip-component.client.js', mode: 'client' },
  ],

  // Auto import components: https://gonuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://gonuxtjs.dev/config-modules
  buildModules: [
  ],

  // Modules: https://gonuxtjs.dev/config-modules
  modules: [
  ],

  // Build Configuration: https://gonuxtjs.dev/config-build
  build: {
    // FIX 1 (Remains): Transpiling modules that rely on crypto.
    transpile: [
      '@sportnco/ui-betslip',
      'uncrypto',
      'unenv'
    ],
  },

  // FIX 2 (Remains): Explicitly mark Node built-in modules as external for the server build.
  vite: {
    build: {
      rollupOptions: {
        // This forces Rollup (used by Nitro/Nuxt Bridge) to ignore bundling
        // these modules, relying on the Node runtime, which fixes the CJS/ESM
        // default export conflict for internal Node APIs.
        external: ['node:crypto', 'crypto'],
      },
    },
  },
}
