
import availableModels from '../../../config/availableModels'
import DefaultModel from './DefaultModel.js'

export default {
  REFRESH_DISABLED: 0,
  REFRESH_PENDING: 1,
  REFRESH_DONE: 2,
  modelMaps: availableModels,
  getComponentModel ({ tree_compo_key: treeComponentKey, model }, pageKey, store, UFWSClient) {
    let mappedModuleClass
    if (model !== undefined) {
      mappedModuleClass = model
    } else {
      const componentKey = this.getComponentKey(treeComponentKey, pageKey)
      mappedModuleClass = this.getMappedModule(componentKey)
    }

    return this.getModel(mappedModuleClass, store, UFWSClient)
  },
  getMappedModule (componentKey) {
    if (!hasOwnProperty.call(this.modelMaps, componentKey)) {
      componentKey = 'default'
    }
    return this.modelMaps[componentKey]
  },
  getModel (mappedModuleClass, store, UFWSClient) {
    let importedModule
    try {
      importedModule = require('~/models/' + mappedModuleClass)
    } catch (e) {
      importedModule = {}
    }

    return {
      ...DefaultModel,
      ...importedModule.default,
      store,
      modelMapper: this,
      UFWSClient,
    }
  },
  getComponentKey (componentKey, pageKey) {
    return pageKey === componentKey ? 'page' : componentKey
  },
  getComponentData (component, pageKey, storedComponents, store, UFWSClient) {
    const currentTime = Date.now()
    const treeComponentKey = this.getComponentKey(component.tree_compo_key, pageKey)
    const ComponentModel = this.getComponentModel(component, pageKey, store, UFWSClient)
    const storedKey = ComponentModel.storeKey !== undefined ? ComponentModel.storeKey : treeComponentKey
    const hasParams = hasOwnProperty.call(storedComponents, storedKey) && hasOwnProperty.call(storedComponents[storedKey], 'params')
    const hasForceRefresh = hasOwnProperty.call(storedComponents, storedKey) && hasOwnProperty.call(storedComponents[storedKey], 'forceRefresh')
    const hasForceRefreshKey = hasOwnProperty.call(storedComponents, storedKey) && hasOwnProperty.call(storedComponents[storedKey], 'forceRefreshKey')
    const storedParams = hasParams ? storedComponents[storedKey].params : {}
    const storedforceRefresh = hasForceRefresh ? storedComponents[storedKey].forceRefresh : this.REFRESH_DISABLED
    const storedforceRefreshKey = hasForceRefreshKey ? storedComponents[storedKey].forceRefreshKey : 0
    const storeData = ComponentModel.buildData(component, treeComponentKey)
    const translationsData = ComponentModel.buildTranslations(component)

    if (hasOwnProperty.call(component, 'error_code') && component.error_code !== 0) {
      if (component.ttl === 0) {
        component.ttl += 3600
      }
      if (!hasOwnProperty.call(storeData, 'error_code')) {
        storeData.error_code = component.error_code
      }
      if (!hasOwnProperty.call(storeData, 'error_message')) {
        storeData.error_message = component.error_message
      }
    }

    const serverOffsetTime = process.client ? store.getters.getServerOffsetTime : 0
    const componentTtl = (currentTime + (component.ttl - serverOffsetTime) * 1000)

    return {
      componentKey: component.tree_compo_key,
      storeKey: storedKey,
      isLoaded: true,
      data: storeData,
      ttl: componentTtl,
      forceRefresh: storedforceRefresh,
      forceRefreshKey: storedforceRefreshKey,
      params: storedParams,
      translations: translationsData,
    }
  },
  resetComponentData (componentKey) {
    return {
      componentKey: undefined,
      storeKey: componentKey,
      isLoaded: false,
      data: {},
      ttl: {},
      forceRefresh: this.REFRESH_DISABLED,
      forceRefreshKey: 0,
      params: {}
    }
  },
}
