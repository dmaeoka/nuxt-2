import { getDeviceCode, getEncapsulatedDeviceCode } from './device'
import ModelMapper from '../models/ModelMapper.js'
import DefaultModel from '../models/DefaultModel.js'
import AbortController from 'abort-controller'

const options = JSON.parse(`<%= JSON.stringify(options) %>`)

const AbortSignal = {
  timeout: function timeout(ms) {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), ms)
    return ctrl.signal
   }
}

export default (context, inject) => {
  const { version, device, namespace, cacheEnabled, clientBaseUrl, ServerBaseUrl, locale, wsLocale, timeout } = options

  function getBaseUrl (clientBaseUrl, ServerBaseUrl) {
    const mockoonBaseUrl = 'https://ws.uf.local.francepari.eu:3003/main/'

    const regex = /^[^:]+:\/\//
    if (regex.test(context?.mockoon)) {
      return context.mockoon
    }

    if (context?.mockoon === true) {
      return mockoonBaseUrl
    }

    return process.server ? ServerBaseUrl : clientBaseUrl
  }

  function nonCachableComponents () {
    if (!cacheEnabled) {
      return []
    }

    return [
      'header',
      'bettingslip',
      'menu_account_shortcuts',
      'global_data',
      'menu_favorites',
    ]
  }

  /**
   * Returns an array of component keys to avoid reaload of data during the page load
   * @returns Array
   */
  function nonReloadableComponents () {
    return [
      'live_events',
    ]
  }

  let eventSource = null
  /**
   * WS call for login
   *
   * @param eventData PAM postMessage for login.
   * @returns {JSON} Json response from the WS call.
   */
  async function doLogin (eventData) {
    const operator = DefaultModel.getEnvOperator()
    let fetchBody = 'code=' + eventData.messParameters

    const geolocationToken = eventData?.geolocationToken
    if (geolocationToken !== undefined && geolocationToken !== '') {
      fetchBody += '&geotoken=' + geolocationToken
    }

    try {
      const response = await fetchCall(
        'login',
        fetchBody,
        false,
        true,
        {'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'}
      )
      if (operator?.isNeedToSetLoginCookie) {
        DefaultModel.setCookie('sessionId', response?.auth_token)
      }
      sendPostMessageSportsBookLogin(response)

      return response
    } catch (e) {
      sendPostMessageSportsBookLogin({ error_code: 500 })
      return {
        error_code: 500,
        error_message: 'Error on login fetch call'
      }
    }
  }

  async function doLoginLaunch (eventData) {
    const operator = DefaultModel.getEnvOperator()
    const token = eventData?.token || ''
    const fetchBody = 'x-point-token=' + token

    const response = await fetchCall(
      'loginkeycloak/launch',
      fetchBody,
      false,
      true,
      {'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    )
    if (operator?.isNeedToSetLoginCookie) {
      DefaultModel.setCookie('sessionId', response?.sessionId)
    }

    sendPostMessageSportsBookLogin(response)

    return response
  }

  async function sendGeoToken (eventData) {
    const token = eventData?.args?.token || ''
    const fetchBody = { data: { token: token } }

    return fetchCall('location/token', fetchBody, true)
  }

  /**
   * WS call for login
   *
   * @param eventData PAM postMessage for login.
   * @returns {JSON} Json response from the WS call.
   */
  async function doLoginWithUserPass (eventData) {
    const operator = DefaultModel.getEnvOperator()
    const clientIp = context.store.getters.getClientIp
    const userAgent = context.store.getters.getUserAgent
    const body = {
      context: {
        url_key: '/',
        device: getDevice(),
        version: '1.0.1',
        lang: 'es',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      data: {
        user: eventData.user,
        password: eventData.password,
        channel: clientIp + '-' + userAgent,
      }
    }

    const response = await fetchCall('loginWithLoginPass', body, true)
    if (operator?.isNeedToSetLoginCookie) {
      DefaultModel.setCookie('sessionId', response?.auth_token)
    }
    sendPostMessageSportsBookLogin(response)

    return response
  }

  /**
   * WS call for login Netbet
   *
   * @param eventData PAM postMessage for login.
   * @returns {JSON} Json response from the WS call.
   */
  async function doLoginWithTokenPlayerIdNetBet (eventData) {
    const fetchBody = 'code=' + eventData.token + '&playerId=' + eventData.playerId

    const response = fetchCall(
      'login',
      fetchBody,
      false,
      true,
      {'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    )
    sendPostMessageSportsBookLogin(response)

    return response
  }
  /**
   * WS call for logout
   *
   * @param eventData eventData PAM postMessage for logout.
   * @returns {JSON} Json response from the WS call.
   */
  async function doLogout (eventData) {
    return fetchCall(
      'logout',
      {},
      false,
      true,
      {'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    )
  }

  async function loadPage (treeKey) {
    // Trailing slash must be removed. WS works without trailing slash
    let urlKey = decodeURIComponent(treeKey)
    if (urlKey !== '/' && urlKey.endsWith('/')) {
      urlKey = urlKey.slice(0, -1)
    }

    // First of all set the current Url and then, try to retrieve its data.
    context.store.commit(`${namespace}/startLoadPage`, urlKey)
    const treeResponse = await newGetTree(urlKey)

    // @TODO: create a procotocol of comunication with WS
    //  404 not found ?
    if (treeResponse.tree === undefined || treeResponse.url_key === undefined) {
      // @TODO: setPageKey as 404?
      return context.error({ statusCode: 404, message: 'Empty results... perhaps a 404' })
    }
    if (treeResponse.tree.components === undefined) {
      treeResponse.tree.components = []
    }

    const language = getTreeLanguage(treeResponse)
    await loadTranslation(language)

    const contentComponents = []
    const flattenedComponents = []
    flattenComponentsTree(treeResponse.tree, flattenedComponents, contentComponents)
    context.store.commit(`${namespace}/setPageKey`, treeResponse.tree.tree_compo_key)
    context.store.commit(`${namespace}/storeTree`, flattenedComponents)
    // @TODO: bettingSlip store should be merged into content store.
    context.store.commit('bettingSlip/storeTree', flattenedComponents)
    context.store.commit(`${namespace}/setCurrentPageComponents`, flattenedComponents)

    context.store.commit(`${namespace}/setContentComponents`, contentComponents)
    if (treeResponse.tree_key === '404') {
      context.error({ statusCode: 404 })
    }
  }
  async function loadTranslation (language) {
    const currentLanguage = context.store.getters.getCurrentLanguage
    if (language === currentLanguage) {
      return
    }

    await fetch( getBaseUrl(clientBaseUrl, ServerBaseUrl) + 'translations_' + language + '.json')
      .then((response)   => response.json())
      .then((data) => {
        context.store.commit('setCurrentLanguage', language)
        context.store.commit('setMappedLanguage', language)
        context.store.commit('setTranslations', data)
      })
      .catch((err) => console.error(err))
  }
  function getTreeLanguage (response) {
    const availableLanguages = response?.languages?.available
    const urlLanguage = response?.url_key.split('/')[1]
    if (availableLanguages?.includes(urlLanguage)) {
      return urlLanguage
    }

    return response?.languages?.default
  }
  function flattenComponentsTree (componentsTree, flattenedComponents, contentComponents, isContent = false) {
    const treeCompoKey = componentsTree?.tree_compo_key || ''

    flattenedComponents.push({
      ttl: componentsTree?.ttl,
      tree_compo_key: treeCompoKey,
      template_key: componentsTree?.template_key,
      context: componentsTree?.context,
      device_size: componentsTree?.device_size,
      // model: componentsTree?.model,
      data: componentsTree?.data,
      params: componentsTree?.params
    })

    const regex = /^main_content_.+$/
    const isCurrentContent = isContent || regex.test(treeCompoKey)

    if (isCurrentContent) {
      contentComponents.push(treeCompoKey)
    }
    const components = componentsTree?.components || []
    components.forEach((component) => {
      flattenComponentsTree(component, flattenedComponents, contentComponents, isCurrentContent)
    })
  }

  /**
   * Call to the WS for the given components. Retrieves the components data and store them.
   *
   * @param urlKey
   * @param refreshableComponents
   * @param skipNonCachable
   * @param isFirstSSRLoad
   * @returns {[]}
   */
  async function loadComponents (urlKey, refreshableComponents, skipNonCachable = false, isFirstSSRLoad = false) {
    const dataErrors = context.store.getters[namespace + '/getDataErrors']
    if (dataErrors > 4) {
      return []
    }
    const requestedComponentsAllInOne = []
    const skippedComponents = []
    getRequestedComponents(refreshableComponents, requestedComponentsAllInOne, skippedComponents, skipNonCachable, isFirstSSRLoad)
    const allComponentsResponse = await getComponentsData(urlKey, requestedComponentsAllInOne)

    const loadedComponents = allComponentsResponse?.components
    if (loadedComponents !== undefined) {
      context.store.commit(`${namespace}/storeTree`, loadedComponents)
      // @TODO: bettingSlip store should be merged into content store.
      context.store.commit('bettingSlip/storeTree', loadedComponents)
    }
    if (allComponentsResponse !== undefined && hasOwnProperty.call(allComponentsResponse, 'error_code')) {
      context.store.commit(`${namespace}/increaseDataErrors`)
    }
    if (skipNonCachable) {
      context.store.commit(`${namespace}/storeSkippedComponents`, skippedComponents)
    }

    return [...requestedComponentsAllInOne, ...skippedComponents]
  }

  /**
   * WS call for the components data
   *
   * @param urlKey
   * @param requestedComponents
   * @returns {JSON}
   */
  async function getComponentsData (urlKey, requestedComponents) {
    const fetchBody = {
      context: getFetchBodyContext(urlKey),
      components: requestedComponents,
    }

    return fetchCall('component/data', fetchBody, true, false)
  }

  /**
   * Build a Flatten array of components using the requestdParams
   *
   * @param components An array of components returned by the component tree.
   * @param requestedComponents An empty array where the flattened components will be built.
   * @param skippedComponents An empty array where the flattened skipped to be cache components will be built.
   * @param skipNonCachable
   * @param isFirstSSRLoad
   */
  function getRequestedComponents (components, requestedComponents, skippedComponents, skipNonCachable = false, isFirstSSRLoad = false) {
    if (Array.isArray(components)) {
      components.forEach(function (component) {
        const isNonCachable = skipNonCachable && nonCachableComponents().includes(component.tree_compo_key)
        const isNonReloadable = !isFirstSSRLoad && nonReloadableComponents().includes(component.tree_compo_key)
        const componentData = {
          tree_compo_key: component.tree_compo_key,
          params: component.params || null,
        }
        if (isNonCachable || isNonReloadable) {
          skippedComponents.push(componentData)
        } else {
          requestedComponents.push(componentData)
        }

        if (component.components !== undefined) {
          getRequestedComponents(component.components, requestedComponents, skippedComponents, skipNonCachable, isFirstSSRLoad)
        }
      })
    }
  }

  /**
   * WS call for the component tree
   *
   * @param urlKey
   * @returns {JSON}
   */
  async function newGetTree (urlKey) {
    const fetchBody = {
      context: getFetchBodyContext(urlKey),
    }
    const treeResponse = await fetchCall('component/datatree', fetchBody)

    // Some client side calls needs url_key properly set (Bettingslip)
    // SSR 404 page is automatically generated.
    if (process.browser && treeResponse?.url_key.includes('404') && urlKey !== treeResponse.url_key) {
      context.redirect(404, treeResponse.url_key)
    }

    return treeResponse
  }

  /**
   * WS call for the component tree
   *
   * @param urlKey
   * @returns {JSON}
   */
  async function getTree (urlKey) {
    const fetchBody = {
      context: getFetchBodyContext(urlKey),
    }
    const treeResponse = await fetchCall('component/trees', fetchBody)

    // Some client side calls needs url_key properly set (Bettingslip)
    // SSR 404 page is automatically generated.
    if (process.browser && treeResponse?.url_key.includes('404') && urlKey !== treeResponse.url_key) {
      context.redirect(404, treeResponse.url_key)
    }

    return treeResponse
  }

  async function favoritesCall (fetchBody) {
    const response = await fetchCall('favorites/set', fetchBody)
    if (response?.data?.success === true) {
      const refreshComponents = {
        storeKeys: [
          'menu_favorites',
        ],
        forceRefresh: ModelMapper.REFRESH_PENDING
      }
      context.store.commit(`${namespace}/expireComponents`, refreshComponents)
    }

    return response
  }

  async function loyaltyPointsCall (url, data) {
    const fetchBody = {
      context: getFetchBodyContext(context.store.state.UFWSClient.urlKey),
      data,
    }
    const response = await fetchCall('loyalty-points/' + url, fetchBody)

    return response?.status === 'success'
  }

  async function betSlipCall (url, data = {}) {
    if (data === undefined || data === null) {
      data = {}
    }

    const tokens = context.store.state.UFWSClient.CSRFTokens
    if (hasOwnProperty.call(tokens, 'betting_slip')) {
      data.csrf_token = tokens.betting_slip
    }

    const fetchBody = {
      context: getFetchBodyContext(context.store.state.UFWSClient.urlKey),
      data,
    }

    // BetSlip Call need to send the device as Mobile App both for normal apps and encapsulated apps.
    fetchBody.context.device = getEncapsulatedDeviceCode(context)

    return await fetchCall('bettingslip' + url, fetchBody)
  }

  /**
   * @param url
   * @param fetchBody
   * @param stringify
   * @param block
   * @param method
   * @param fetchHeaders
   * @returns JSON
   */
  async function fetchCallNew ({ url, fetchBody = {}, stringify = true, block = true, method = 'POST', fetchHeaders = {} }) {
    const baseUrl = getBaseUrl(clientBaseUrl, ServerBaseUrl)

    if (block) {
      context.store.commit('setToggle', { name: 'blockFetchCall', value: true })
    }

    const defaultFetchHeaders = {
      'Content-type': 'application/json',
      'User-Agent': context.store.getters.getUserAgent,
      Cookie: context.store.state[namespace].headersCookie,
    }
    const headers = { ...defaultFetchHeaders, ...fetchHeaders }

    // Bridge Sportsbook header to WS in Server Side.
    if (process.server) {
      const headersXSnc = context.store.state[namespace].headersXSnc
      if (headersXSnc !== undefined) {
        headers['x-snc'] = headersXSnc
      }
    }

    if (process.env.BASIC_AUTH !== '')
      headers['Authorization'] = 'Basic ' + process.env.BASIC_AUTH

    const msTimeout = timeout * 1000
    const fetchConfig = {
      method: method,
      credentials: 'include',
      headers: headers,
      signal: AbortSignal.timeout(msTimeout),
    }

    if (method === 'POST') {
      if (stringify) {
        fetchBody = prepareFetchBody(fetchBody)
      }
      fetchConfig.body = fetchBody
    }

    const response = await fetch(getBaseUrl(clientBaseUrl, ServerBaseUrl) + addSourceFetchUrl(url), fetchConfig)
      .then(async function (response) {
        if (response.status < 200 || response.status >= 300) {
          const errorMessage = `Unexpected response fetching ${baseUrl + url}
Received code:${response.status}
Request body:${JSON.stringify(fetchBody)}`
          await client2ServerLog(errorMessage)
        }
        if (response.status === 500) {
          context.store.commit(`${namespace}/increaseDataErrors`)
        }

        return { status: response.status, body: await response.json() }
      })
      .catch(async function (err) {

        const message = {
          type: 'danger',
          message: t('ws_fetching_error')
        }

        context.store.commit(`${namespace}/addMessage`, message)
        context.store.commit(`${namespace}/increaseDataErrors`)
        const errorMessage = `
--------------
- Error fetching ${baseUrl + url}
- Caught error:
${err}
- Request body:
${JSON.stringify(fetchBody)}
--------------
`
        await client2ServerLog(errorMessage)

        if (err.toString().startsWith('TypeError:')) {
          err = t('ws_fetching_error')
        }

        return {
          status: 500,
          body: {
            error_code: 500,
            error_message: err,
          }
        }
      })

    if (block) {
      context.store.commit('setToggle', { name: 'blockFetchCall', value: false })
    }

    const redirectStatus = [302, 307]
    if (redirectStatus.includes(response.status)) {
      context.redirect(response.status, response.body.url_key)
    }

    if (response.status === 404) {
      context.store.commit(`${namespace}/increaseDataErrors`)
    }

    return response.body
  }

  async function fetchCall (url, fetchBody = {}, stringify = true, block = true, fetchHeaders = {}) {
    return fetchCallNew({ url, fetchBody, stringify, block, method: 'POST', fetchHeaders })
  }

  function getFetchBodyContext (urlKey) {
    const regex = /^\/wrapper\/.*$/
    const isFrameWrapped = regex.test(urlKey)
    const wsUrlKey = isFrameWrapped ? urlKey.slice(8) : urlKey
    const device = isFrameWrapped ? 'web_vuejs_iframe' : getDevice()

    return {
      url_key: wsUrlKey,
      url_params: context.route.query,
      device: device,
      // devices: getDevices(), // @TODO: will be needed in short future?
    }
  }

  function getDevice () {
    return getDeviceCode(context)
  }

  // @TODO: will be needed in short future?
  // function getDevices () {
  //   const devices = []
  //   for (const deviceMap in devicesMap) {
  //     if (context.$device[deviceMap]) {
  //       devices.push(devicesMap[deviceMap])
  //     }
  //   }
  //
  //   return devices
  // }

  function prepareFetchBody (fetchBody) {
    const urlKey = context.store.state.UFWSClient.urlKey

    const requestContext = {
      version,
      device,
      lang: context.store.getters.getCurrentLanguage || urlKey.split('/')[1],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }

    const ip = context.store.getters.getClientIp

    fetchBody.context = {
      url_key: urlKey,
      clientIp: ip.trim(),
      ...requestContext,
      ...fetchBody.context
    }

    return JSON.stringify(fetchBody)
  }

  function getEventSource (url) {
    if (eventSource !== null) {
      eventSource.close()
    }
    eventSource = new EventSource(url)

    return eventSource
  }

  async function client2ServerLog (errorMessage) {
    if (process.client && window?.client2Server && window.client2Server === true) {
      await fetch(window.location.origin + '/_client_error', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Content-type': 'text/plain; charset=UTF-8',
        },
        body: errorMessage
      })
    } else {
      console.error(errorMessage)
    }
  }

  function isNotMobileApp () {
    const device = getDevice()

    return device !== 'web_vuejs_android' && device !== 'web_vuejs_ios'
  }

  function t ($key, defaultText = undefined) {
    return context.store.getters.getTranslation($key, defaultText) || $key
  }

  function rt (key, replacements) {
    let translation = this.t(key)

    if (translation?.match === undefined) {
      return key
    }

    translation.match(/\[\[(.*?)]]/g)?.forEach(replaceTag => {
      translation = translation.replace(replaceTag, replacements?.[replaceTag] ?? '')
    })

    return translation
  }

  function getBetBuilder (betslipUid) {
    const url = 'betbuilder/betslip/' + betslipUid + '?type=long'

    return fetchCallNew({ url, method: 'GET' })
  }

  function setBetBuilder (provider, data) {
    const fetchBody = { data }

    return fetchCallNew({ url: 'betbuilder-sc/betslip-creation/' + provider, method: 'POST', fetchBody })
  }

  function setOddFormat (format) {
    const fetchBody = {
      context: getFetchBodyContext(context.store.state.UFWSClient.urlKey),
      data: format,
    }

    return fetchCallNew({ url: 'odd-format', fetchBody })
  }

  function addSourceFetchUrl (baseUrl) {
    const isMobile = context.store.getters.getIsMobileApp
    const isEncapsulated = context.store.getters.getIsMobileAppEncapsulated

    if (isMobile || isEncapsulated) {
      const separator = getUrlSeparator(baseUrl)

      if (!baseUrl.includes('source=nativeapp')) {
        return `${baseUrl}${separator}source=nativeapp`
      }
    }

    return baseUrl
  }

  function getUrlSeparator (url) {
    return url.includes('?') ? '&' : '?'
  }

  function getSupportRedirectUrl () {
    const fetchBody = {
      context: getFetchBodyContext(context.store.state.UFWSClient.urlKey),
    }

    return fetchCallNew({ url: 'generate-support-jwt', fetchBody })
  }

  function sendPostMessageSportsBookLogin (response) {
    const errorCode = response?.error_code
    const loginFailed = errorCode !== undefined && errorCode !== 0 && errorCode !== null

    context.$SncPostMessagesBus.send({ event: 'sportsbook_login_success', success: !loginFailed })
  }

  inject('UFWSClient', {
    betSlipCall,
    favoritesCall,
    loyaltyPointsCall,
    loadPage,
    flattenComponentsTree,
    loadComponents,
    doLogin,
    doLoginLaunch,
    doLoginWithUserPass,
    doLoginWithTokenPlayerIdNetBet,
    doLogout,
    sendGeoToken,
    getEventSource,
    fetchCall,
    fetchCallNew,
    getDevice,
    isNotMobileApp,
    t,
    rt,
    getBetBuilder,
    setOddFormat,
    getSupportRedirectUrl,
    locale,
    wsLocale,
    sendPostMessageSportsBookLogin,
    setBetBuilder,
  })
}
