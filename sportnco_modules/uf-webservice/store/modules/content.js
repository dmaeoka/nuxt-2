import ModelMapper from '../../models/ModelMapper.js'
import Message from '../../../../src/models/Entity/Message'

export default () => ({
  namespaced: true,
  state: () => ({
    skippedComponents: [],
    counters: {}, // Counters to be stored and used by components.
    CSRFTokens: {}, // Cross Request Site Forgery tokens
    urlKey: '/', // The Url of the current page loaded.
    pageKey: '', // homepage, competition page, event page... a key of the current page loaded.
    components: { live_events: ModelMapper.resetComponentData('live_events') }, // The data of the components currently
    // shown.
    contentComponents: [], // List of components that contains contens of the current page. (Not the structure, only content).
    currentPageComponents: [], // The list of components shown by the current page.
    headersCookie: null,
    headersXSnc: undefined,
    dataErrors: 0,
  }),
  mutations: {
    startLoadPage (contentState, urlKey) {
      contentState.urlKey = urlKey
      contentState.dataErrors = 0
      // Empty the content components when loading new page starts,
      const newComponents = { ...contentState.components }
      contentState.contentComponents.forEach(componentKey => {
        newComponents[componentKey] = ModelMapper.resetComponentData(componentKey)
      })
      contentState.components = { ...newComponents }
    },
    setUrlKey (contentState, urlKey) {
      contentState.urlKey = urlKey
    },
    storeSkippedComponents (contentState, skippedComponents) {
      contentState.skippedComponents = skippedComponents
    },
    setPageKey (contentState, pageKey) {
      contentState.pageKey = pageKey
    },
    setCSRFToken (contentState, token) {
      const newtokens = {
        ...contentState.CSRFTokens,
        [token.id]: token.value,
      }
      contentState.CSRFTokens = { ...newtokens }
    },
    initializeCounter (contentState, counter) {
      const newCounters = { ...contentState.counters }
      newCounters[counter.name] = 0
      contentState.counters = { ...newCounters }
    },
    increaseCounter (contentState, counter) {
      const newCounters = { ...contentState.counters }
      newCounters[counter.name]++
      contentState.counters = { ...newCounters }
    },
    decreaseCounter (contentState, counter) {
      const newCounters = { ...contentState.counters }
      newCounters[counter.name]--
      contentState.counters = { ...newCounters }
    },
    increaseDataErrors (contentState) {
      contentState.dataErrors += 1
    },
    resetDataErrors (contentState) {
      contentState.dataErrors = 0
    },
    removeData (contentState, storeKey) {
      contentState.components[storeKey].data = {}
    },
    addMessage (contentState, message) {
      const newComponents = { ...contentState.components }
      if (!hasOwnProperty.call(newComponents, 'message')) {
        newComponents.message = ModelMapper.resetComponentData('message')
        newComponents.message.componentKey = 'message'
        newComponents.message.data = []
      }

      // Convert newComponents.message.data to array (sometimes is an object)
      const data = []
      Object.keys(newComponents.message.data).forEach((messageIndex) => {
        data.push(newComponents.message.data[messageIndex])
      })
      newComponents.message.data = data

      if (newComponents.message.data.find(msg => msg.message === message.message)) {
        return
      }

      const builtMessage = new Message(message)
      newComponents.message.data.push(builtMessage)
      contentState.components = { ...newComponents }

      if (process.client) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        //this.$SncPostMessagesBus.send({ event: 'sportbook_request_external_scroll' })
        this.$SncPostMessagesBus.send({ event: 'sportbook_request_parent_scroll_top' })
      }
    },
    expireMessages (contentState) {
      const components = { ...contentState.components }
      if (!hasOwnProperty.call(components, 'message') || !hasOwnProperty.call(components.message, 'data')) {
        return
      }

      const currentTime = Date.now()
      const data = []
      Object.keys(components.message.data).forEach((messageIndex) => {
        const message = components.message.data[messageIndex]
        if (currentTime < message.expiration) {
          data.push(message)
        }
      })

      components.message.data = data
      contentState.components = { ...components }
    },
    setContentComponents (contentState, components) {
      contentState.contentComponents = components
    },
    setCurrentPageComponents (contentState, components) {
      const currentPageComponents = []
      components.forEach(function (component) {
        const componentKey = component.tree_compo_key
        // @TODO: is possible to get and inject here the UFWSclient ?
        const ComponentModel = ModelMapper.getComponentModel(component, contentState.pageKey, this, {})
        const storeKey = ComponentModel.storeKey !== undefined ? ComponentModel.storeKey : componentKey
        currentPageComponents.push(storeKey)
      }, this)

      // Disable components that are on previous page but not in current.
      // Mutations Follow Vue's Reactivity Rules
      const newComponents = { ...contentState.components }
      contentState.currentPageComponents.forEach(function (componentKey) {
        if (!currentPageComponents.includes(componentKey)) {
          newComponents[componentKey] = ModelMapper.resetComponentData(componentKey)
        }
      }, [currentPageComponents])

      contentState.components = { ...newComponents }
      contentState.currentPageComponents = currentPageComponents
    },

    storeTree (contentState, components) {
      // Mutations Follow Vue's Reactivity Rules
      const newComponents = { ...contentState.components }
      // First empty the the previously existing data of components to store.
      components.forEach(function (component) {
        const builtComponent = ModelMapper.getComponentData(component, contentState.pageKey, contentState.components, this)
        const storeKey = builtComponent.storeKey
        if (hasOwnProperty.call(newComponents, storeKey) && hasOwnProperty.call(newComponents[storeKey], 'data')) {
          newComponents[storeKey].data = {}
        }
      }, this)

      components.forEach(function (component) {
        const newComponentData = ModelMapper.getComponentData(component, contentState.pageKey, contentState.components, this)
        // // Multiple components can share storeKey so its data must be merged
        if (hasOwnProperty.call(newComponents, newComponentData.storeKey) && hasOwnProperty.call(newComponents[newComponentData.storeKey], 'data')) {
          const oldData = newComponents[newComponentData.storeKey].data
          const newData = newComponentData.data
          newComponentData.data = {
            ...oldData,
            ...newData
          }
        }
        newComponents[newComponentData.storeKey] = newComponentData
        // Perhaps WS can return a property if want to force render of the component.
        if (newComponents[newComponentData.storeKey]?.forceRefresh === ModelMapper.REFRESH_PENDING) {
          newComponents[newComponentData.storeKey].forceRefresh = ModelMapper.REFRESH_DONE
          newComponents[newComponentData.storeKey].forceRefreshKey += 1
        }
      }, this)

      // Check if the component Model have a function to execute after to storage process.
      components.forEach(function (component) {
        const ComponentModel = ModelMapper.getComponentModel(component, contentState.pageKey, this)
        if (hasOwnProperty.call(ComponentModel, 'postStore')) {
          ComponentModel.postStore(newComponents)
        }
      }, this)

      contentState.components = { ...newComponents }
    },
    setHeadersCookie (contentState, req) {
      if (req !== undefined) {
        if (hasOwnProperty.call(req, 'headers')) {
          contentState.headersXSnc = req.headers?.['x-snc'] || undefined
          if (hasOwnProperty.call(req.headers, 'cookie')) {
            contentState.headersCookie = req.headers.cookie
          }
        }
      }
    },
    /**
     * Sets to expire a given component:
     *
     * components = {
     *   storeKeys: 'header',
     *   forceRefresh; 0 // 0 not force | 1 forced pending | 2 forced is done
     * }
     *
     * @param contentState
     * @param component
     */
    expireComponent (contentState, component) {
      const newComponents = { ...contentState.components }
      if (newComponents[component.storeKey] !== undefined) {
        newComponents[component.storeKey].forceRefresh = component?.forceRefresh || ModelMapper.REFRESH_PENDING
        newComponents[component.storeKey].ttl = 0

        contentState.components = { ...newComponents }
      }
    },
    /**
     * Sets to expire a given array of components (by storeKeys):
     *
     * const components = {
     *   storeKeys: [
     *     'header',
     *     'menu_account_shortcuts',
     *   ],
     *   forceRefresh: ModelMapper.REFRESH_PENDING // 0 not force | 1 forced pending | 2 forced is done
     * }
     *
     * @param contentState
     * @param components
     */
    expireComponents (contentState, components) {
      const newComponents = { ...contentState.components }

      components.storeKeys.forEach((storeKey) => {
        if (newComponents[storeKey] !== undefined) {
          newComponents[storeKey].forceRefresh = components?.forceRefresh || ModelMapper.REFRESH_PENDING
          newComponents[storeKey].ttl = 0
        }
      })


      contentState.components = { ...newComponents }
    },
    /**
     * Set Params to pass when calling the WS for the given component.
     *
     * @param contentState
     * @param component
     */
    setComponentsParam (contentState, component) {
      contentState.components[component.storeKey].params = component.params
    },
    setLiveMatch (contentState, dataToUpdate) {
      const newComponents = { ...contentState.components }
      let currentEvents = {}
      if (hasOwnProperty.call(newComponents, 'live_events') &&
      hasOwnProperty.call(newComponents.live_events, 'data')) {
        if (Object.keys(newComponents.live_events.data).length > 0) {
          currentEvents = { ...newComponents.live_events.data }
        }
        newComponents.live_events.data = {
          ...currentEvents,
          ...dataToUpdate,
        }
      }

      contentState.components = { ...newComponents }
    },
    //
    // BettingSlip functions
    //
    bettingSLipMatchStoped (contentState, payload) {
      const matchId = payload.matchId
      if (payload.active === 0) {
        const idx = contentState.components.betting_slip.data.stoppedMatchIds.includes(matchId)
        if (!idx) {
          contentState.components.betting_slip.data.stoppedMatchIds.push(matchId)
        }
      } else {
        const idx = contentState.components.betting_slip.data.stoppedMatchIds.indexOf(matchId)
        if (idx !== -1) {
          contentState.components.betting_slip.data.stoppedMatchIds.splice(idx, 1)
        }
      }
    },
    bettingSLipStopChoices (contentState, payload) {
      const id = payload.id
      if (!payload.active) {
        const idx = contentState.components.betting_slip.data.stoppedChoiceIds.includes(id)
        if (!idx) {
          contentState.components.betting_slip.data.stoppedChoiceIds.push(id)
        }
      } else {
        const idx = contentState.components.betting_slip.data.stoppedChoiceIds.indexOf(id)
        if (idx !== -1) {
          contentState.components.betting_slip.data.stoppedChoiceIds.splice(idx, 1)
        }
      }
    },
    setLiveBetChange (contentState, liveBetChange) {
      const storedBets = contentState.components.betting_slip.data.bets || []
      storedBets.forEach((storedBet) => {
        if (storedBet.choice.id === liveBetChange.choiceId) {
          storedBet.choice.odd = liveBetChange.odd
          storedBet.choice.odds_display = liveBetChange.odds_display
          storedBet.hash = liveBetChange.hash
          storedBet.td = liveBetChange.td
        }
      })
    },
    bettingSlipLiveBetsChanges (contentState, payload) {
      const storedBets = contentState.components.betting_slip.data.bets || []
      storedBets.forEach((storedBet) => {
        if (storedBet?.choice?.id === payload.bet.choice.id) {
          storedBet.possible_payout = payload.bet.possible_payout
        }
      })
      contentState.components.betting_slip.data.gain = payload.gain
    },
    bettingSlipChangeStake (contentState, stakeChange) {
      // @TODO: refactor this to get the bettingslip state
      const bettingslipState = contentState.components.betting_slip.data

      bettingslipState.bets.forEach((storedBet) => {
        if (storedBet.choice.id === stakeChange.choice.id) {
          storedBet.stake = stakeChange.increment.toString().replace('.', ',')//.toFixed(2)
        }
      })
    },
    bettingSlipChangeTotalStake (contentState, stakeChange) {
      // @TODO: refactor this to get the bettingslip state
      const bettingslipState = contentState.components.betting_slip.data
      bettingslipState.gain.total_stake = stakeChange.increment.toString().replace('.', ',')//.toFixed(2)
    },
    setKeepSelection (contentState, keepSelection) {
      contentState.components.betting_slip.data.keepSelection = keepSelection
    },
    setOddsChangeAfterBetPlacement (contentState, oddsChangeAfterBetPlacement) {
      contentState.components.betting_slip.data.oddsChangeAfterBetPlacement = oddsChangeAfterBetPlacement
    },
    StoreBettingSLipFromApi (contentState, payload) {
      const newComponents = { ...contentState.components }
      newComponents.betting_slip.data = {
        ...newComponents.betting_slip.data,
        bets: payload.bets,
        betsIds: payload.betsIds,
        acceptStakeChange: payload.acceptStakeChange,
        freebetId: payload.freebetId,
        freebetToggle: payload.freebetToggle,
        availableFreebet: payload.availableFreebet,
        displayFreeBet: payload.displayFreeBet,
        betTypes: payload.betTypes,
        gain: payload.gain,
        combiboost: payload.combiboost,
        keepSelection: hasOwnProperty.call(payload, 'keepSelection') ? payload.keepSelection : false,
        keptBetBuilderIds: payload?.keptBetBuilderIds,
      }
      contentState.components = { ...newComponents }
    },
    setIframeResizer (contentState, iframeResizer) {
      // Mutations Follow Vue's Reactivity Rules
      const newComponents = { ...contentState.components }
      const hasUrl = iframeResizer?.url !== undefined
      const hasClass = iframeResizer?.class !== undefined

      iframeResizer.storeKeys.forEach(function (storeKey) {
        const iframeData = newComponents?.[storeKey]?.data?.iframes
        if (iframeData !== undefined) {
          Object.keys(iframeData).forEach((iframeKey) => {
            const iframe = iframeData[iframeKey]
            let doResize = false
            const iframeUrl = iframe?.url || ''
            const regex = /^.+:\/\/[^\/]+\/([^?]*)/g
            const urlRelative = iframeUrl.replace(regex, '/$1')
            const iframeResizerUrlRelative = iframeResizer?.url.replace(regex, '/$1')
            console.log(hasUrl + ' && ' + urlRelative + ' === ' + iframeResizerUrlRelative)
            if (hasUrl && urlRelative === iframeResizerUrlRelative) {
              doResize = true
            }

            if (hasClass) {
              const iframeClassString = iframe?.class || ''
              const iframeClasses = iframeClassString.split(' ').map(element => element.trim())
              if (iframeClasses.includes(iframeResizer?.class)) {
                doResize = true
              }
            }

            if (doResize) {
              if (iframeResizer?.height !== undefined && iframeResizer?.height !== null) {
                iframe.height = iframeResizer.height
              }
              if (iframeResizer?.width !== undefined && iframeResizer?.width !== null) {
                iframe.width = iframeResizer.width
              }
            }
          })
        }
      })
      contentState.components = { ...newComponents }
    }
  },
  getters: {
    getComponents (contentState) {
      return contentState.components
    },
    getContentComponents (contentState) {
      return contentState.contentComponents
    },
    getSkippedComponents (contentState) {
      return contentState.skippedComponents
    },
    getUrlKey (contentState) {
      return contentState.urlKey
    },
    getCounters (contentState) {
      return contentState.counters
    },
    getHeadersCookie (contentState) {
      return contentState.headersCookie
    },
    getPageKey (contentState) {
      return contentState.pageKey
    },
    getDataErrors (contentState) {
      return contentState.dataErrors
    },
  },
})
