<template>
  <div v-if="hasRedirect()"></div>
</template>

<script>
import BaseModel from '~/mixins/BaseModel'

const expireToggleBlockers = {
  header: 'HeaderOverCenterPage',
}

export default {
  mixins: [
    BaseModel('RedirectModel')
  ],
  data () {
    return {
      isRefreshing: false,
      refreshInterval: null,
      isBrowserTabActive: true,
    }
  },
  mounted () {
    if (process.client) {
      // this.$root.$on('start-component-refresh', this.startRefresh)

      window.addEventListener('focus', () => {
        this.isBrowserTabActive = true
      });
      window.addEventListener('blur', () => {
        this.isBrowserTabActive = false
      });

      this.startRefresh()
      this.$nextTick(() => {
        if (this.hasRedirect()) {
          this.$nuxt.$loading.start()
        }
      }, this)
    }
  },
  methods: {
    startRefresh () {
      // Mobile Application do not need nuxt managing the component refreshing.
      const isMobile = this.$store.getters.getIsMobileApp
      if (isMobile) {
        return
      }

      if (this.refreshInterval !== null) {
        clearInterval(this.refreshInterval)
      }
      this.refreshInterval = setInterval(() => {
        this.refresh()
      }, 1000)
    },
    hasRedirect () {
      if (this.model.hasUrl()) {
        if (process.browser) {
          this.$store.commit('setError', this.model.getMessage())
          const redirectUrl = this.model.getUrl()
          this.model.commit('removeData', this.model.storeKey)
          if (this.$route.path !== redirectUrl) {
            if (this.refreshInterval !== null) {
              clearInterval(this.refreshInterval)
            }
            window.location.href = redirectUrl
          }

          return true
        }
      }

      return false
    },
    async refresh () {
      // Only works in Home?
      // When we are in an iframe, maybe we don't have the focus.
      // @TODO: try to detect if we are in an iframe
      // const inIframe = window.self !== window.top;
      //if (!inIframe && !this.isBrowserTabActive) {
      //  return
      //}

      if (this.$nuxt.err !== false && this.$nuxt.err !== undefined) {
        clearInterval(this.refreshInterval)
      }

      const serverOffsetTime = this?.$store?.getters?.getServerOffsetTime
      const currentTime = Date.now() - serverOffsetTime * 1000

      if (this.$store.state.errors.length > 0) {
        this.$store.commit('expireError', currentTime)
      }

      const blockFetchCall = this.$store.getters.getToggle('blockFetchCall')
      if (this.isRefreshing || blockFetchCall) {
        return
      }

      // Too many errors
      if (this.$store.state.errors.length > 4) {
        return
      }

      // Get Expired components
      const refreshableComponents = []
      const components = this.model.getComponents()
      let refreshEventStream = false
      Object.keys(components).forEach(storeKey => {
        if (components[storeKey]?.componentKey === undefined) {
          return
        }
        const blockerToggle = expireToggleBlockers?.[storeKey]
        const isBlocked = this?.$store?.getters?.getToggle(blockerToggle) || false

        if (!isBlocked && components[storeKey].ttl <= currentTime) {
          refreshableComponents.push({ tree_compo_key: components[storeKey].componentKey, params: components[storeKey].params })
          if (storeKey === 'live_event_stream') refreshEventStream = true
        }
      }, refreshableComponents)

      // And refresh them if found and not other refreshing process is running.
      if (!this.isRefreshing && refreshableComponents.length > 0) {
        this.isRefreshing = true
        await this.$UFWSClient.loadComponents(this.model.getUrlKey(), refreshableComponents)
        this.$root.$emit('refreshed-components', refreshableComponents)
        this.isRefreshing = false
      }

      if (refreshEventStream) {
        this.$root.$emit('refresh-live-stream')
      }
    }
  }
}
</script>
