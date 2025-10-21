// import { defineNuxtConfig } from '@nuxt/bridge'

// export default defineNuxtConfig({
export default {
  bridge: false,
  target: 'server',

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
    { src: '~/plugins/betslip-widget.client.js', mode: 'client' }
  ],

  // Auto import components: https://gonuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://gonuxtjs.dev/config-modules
  buildModules: [
  ],

  // Modules: https://gonuxtjs.dev/config-modules
  modules: [
  ],

  build: {

    transpile: [
      '@sportnco/ui-betslip'
    ],

    extend(config, { isClient }) {
      // Extend only webpack config for client-bundle
      if (isClient && process.env.NODE_ENV === 'production') {
        config.plugins.push(
          new (require('webpack').DefinePlugin)({
            __VUE_PROD_DEVTOOLS__: false
          })
        );
      }
    }
  },

  serverMiddleware: [
    '~/server-middleware/betslip-events.ts'
  ],

  server: {
    host: '0.0.0.0',
    port: 5000
  }
}
