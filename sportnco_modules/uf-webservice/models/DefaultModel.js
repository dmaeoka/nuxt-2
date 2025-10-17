import PlayerAccountModel from '~/models/PlayerAccountModel'

const options = JSON.parse(`<%= JSON.stringify(options) %>`)

const { namespace } = options

export default {
  modelMapper: undefined,
  store: undefined,
  storeKey: undefined,
  UFWSClient: undefined,
  buildData (component = {}, componentKey = '') {
    return this.getComponentData(component)
  },
  getEnvOperator () {
    return JSON.parse(process.env.operator)
  },
  getComponents () {
    return this.store.getters[namespace + '/getComponents']
  },
  getSkippedComponents () {
    return this.store.getters[namespace + '/getSkippedComponents']
  },
  getComponentData (component) {
    return component?.data !== undefined ? component.data : {}
  },
  commit (mutation, value) {
    this.store.commit(namespace + '/' + mutation, value)
  },
  getCounter (name) {
    // @TODO: refactor to better initializing
    let counters = this.store.getters[namespace + '/getCounters']
    if (!hasOwnProperty.call(counters, name)) {
      this.commit('initializeCounter', { name })
      counters = this.store.getters[namespace + '/getCounters']
    }

    return counters[name]
  },
  increaseCounter (name) {
    // @TODO: refactor to better initializing
    const counters = this.store.getters[namespace + '/getCounters']
    if (!hasOwnProperty.call(counters, name)) {
      this.commit('initializeCounter', { name })
    }
    this.commit('increaseCounter', { name })
  },
  decreaseCounter (name) {
    // @TODO: refactor to better initializing
    const counters = this.store.getters[namespace + '/getCounters']
    if (!hasOwnProperty.call(counters, name)) {
      this.commit('initializeCounter', { name })
    }
    this.commit('decreaseCounter', { name })
  },
  isLoaded () {
    const components = this.getComponents()
    if (hasOwnProperty.call(components, this.storeKey)) {
      if (hasOwnProperty.call(components[this.storeKey], 'isLoaded')) {
        return components[this.storeKey].isLoaded
      }
    }

    return false
  },
  hasError (components = null) {
    if (components === null) {
      components = this.getComponents()
    }
    if (this.hasData(components)) {
      return hasOwnProperty.call(components[this.storeKey].data, 'error_code')
    }

    return false
  },
  hasData (components = null) {
    if (components === null) {
      components = this.getComponents()
    }
    if (this.storeKey && hasOwnProperty.call(components, this.storeKey)) {
      return hasOwnProperty.call(components[this.storeKey], 'data')
    }

    return false
  },
  hasComponentKey (components = null) {
    if (components === null) {
      components = this.getComponents()
    }

    if (this.hasData(components)) {
      return hasOwnProperty.call(components[this.storeKey], 'componentKey')
    }

    return false
  },
  getCount () {
    const components = this.getComponents()
    if (this.hasData(components)) {
      if (Array.isArray(components[this.storeKey].data)) {
        return components[this.storeKey].data.length
      }

      return Object.keys(components[this.storeKey].data).length
    }

    return 0
  },
  notEmpty () {
    return this.getCount() > 0
  },
  getError () {
    const components = this.getComponents()
    if (this.hasError(components)) {
      const data = components[this.storeKey].data

      return {
        code: data.error_code,
        message: hasOwnProperty.call(data, 'error_message') ? data.error_message : ''
      }
    }

    return {}
  },
  getRefreshKey () {
    const components = this.getComponents()

    return this.hasData(components) ? components[this.storeKey].forceRefreshKey : 0
  },
  getUrlKey () {
    return this.store.getters[namespace + '/getUrlKey']
  },
  getCookie (name, cookieSource = undefined) {
    if (cookieSource === undefined) {
      cookieSource = document.cookie
    }
    const value = '; ' + cookieSource

    const parts = value.split(';')
    let finalValue
    parts.forEach(part => {
      const subParts = part.split('=')
      if (subParts.length === 2 && subParts[0].trim() === name) {
        finalValue = subParts[1].trim()
        return finalValue
      }
    })

    return finalValue
  },
  addCookies (cookiesString, cookiesList) {
    cookiesList.forEach(cookie => {
      const name = cookie.name
      const value = cookie.value
      const expiryDays = cookie?.expiryDays || 365
      const domain = cookie?.domain || null
      const path = cookie?.path || '/'
      cookiesString = this.addCookie(cookiesString, name, value, expiryDays, domain, path)
    })

    return cookiesString
  },
  addCookie (cookiesString, name, value, expiryDays = 365, domain = null, path = '/') {
    const newCookiesObj = {}
    if (typeof cookiesString !== 'string') {
      cookiesString = ''
    }
    // uf-session=2c1d104e6001869e29568a12b0b8a0fa; isMobileApp=false; isMobileAppEncapsulated=false;expires=Fri, 09 Aug 2024 08:58:17 GMT;path=/
    const cookies = cookiesString.trim().split('; ')
    // [
    //   uf-session=2c1d104e6001869e29568a12b0b8a0fa
    //   isMobileApp=false
    //   isMobileAppEncapsulated=false;expires=Fri, 09 Aug 2024 08:58:17 GMT;path=/
    // ]
    cookies.forEach(cookieString => { // isMobileAppEncapsulated=false;expires=Fri, 09 Aug 2024 08:58:17 GMT;path=/
      const cookieParts = cookieString.trim().split(';')
      // [
      //   0 => isMobileAppEncapsulated=false
      //   1 => expires=Fri, 09 Aug 2024 08:58:17 GMT
      //   2 => domain=.myDomain.com
      //   3 => path=/
      // ]
      const firstPair = cookieParts[0].split('=') // First one have the name
      const cookieName = firstPair[0].trim()
      if (cookieName !== '') {
        newCookiesObj[cookieName] = cookieString
      }
    })

    newCookiesObj[name] = this.buildCookieString(name, value, expiryDays, domain, path)
    const newCookiesArray = Object.values(newCookiesObj)

    return newCookiesArray.join('; ')
  },
  buildCookieString (name, value, expiryDays = 365, domain = null, path = '/') {
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + expiryDays)
    const cookie = [
      `${name}=${value}`,
      `expires=${expireDate.toUTCString()}`,
      `path=${path}`
    ]

    if (domain !== null) {
      cookie.push(`domain=${domain}`)
    }

    return cookie.join(';')
  },
  setCookieTo (target, name, value, expiryDays = 365, domain = null, path = '/') {
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + expiryDays)
    const cookie = [
      `${name}=${value}`,
      `expires=${expireDate.toUTCString()}`,
      `path=${path}`
    ]

    if (domain !== null) {
      cookie.push(`domain=${domain}`)
    }

    target.cookie = cookie.join(';')
  },
  setCookie (name, value, expiryDays = 365, domain = null, path = '/') {
    this.setCookieTo(document, name, value, expiryDays, domain, path)
  },
  getPageKey () {
    return this.store.getters[namespace + '/getPageKey']
  },
  getData () {
    const components = this.getComponents()

    return this.hasData(components) ? components[this.storeKey].data : {}
  },
  getParams () {
    const components = this.getComponents()
    if (hasOwnProperty.call(components, this.storeKey) && hasOwnProperty.call(components[this.storeKey], 'params')) {
      return components[this.storeKey].params
    }

    return {}
  },
  getComponentKey () {
    const components = this.getComponents()

    return this.hasComponentKey(components) ? components[this.storeKey].componentKey : ''
  },
  expireComponent (storeKey = undefined, forceRefresh = undefined) {
    if (storeKey === undefined) {
      storeKey = this.storeKey
    }
    if (forceRefresh === undefined) {
      forceRefresh = this.modelMapper.REFRESH_PENDING
    }

    this.model.commit('expireComponent', { storeKey: storeKey, forceRefresh: forceRefresh })
  },
  expireComponents (storeKeys, forceRefresh = undefined) {
    if (forceRefresh === undefined) {
      forceRefresh = this.modelMapper.REFRESH_PENDING
    }
    const expireComponents = {
      storeKeys: storeKeys,
      forceRefresh: forceRefresh
    }

    this.commit('expireComponents', expireComponents)
  },
  isLogged () {
    const components = this.getComponents()
    const playerAccount = components?.[PlayerAccountModel.storeKey]?.data?.player || null

    return playerAccount !== null
  },
  buildTranslations (component = {}) {
    const value = this.getComponentData(component)

    return value?.texts || {}
  },
  wsT (key = '') {
    const components = this.getComponents()

    return components?.[this.storeKey]?.translations?.[key] || key
  },
  wsRT (key = '', replacements = {}) {
    let translation = this.wsT(key)

    if (translation?.match === undefined) {
      return key
    }

    translation.match(/\[\[(.*?)]]/g)?.forEach(replaceTag => {
      translation = translation.replace(replaceTag, replacements?.[replaceTag] ?? '')
    })

    return translation
  }
}
