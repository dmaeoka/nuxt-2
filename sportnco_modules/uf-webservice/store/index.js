
import contentModule from './modules/content.js'

// get the options out using lodash templates
const options = JSON.parse(`<%= JSON.stringify(options) %>`)
const { namespace } = options

export default (context) => {
  context.store.registerModule(namespace, contentModule())
  // Set cookie header in store for usage of javacript fetch in server side.
  context.store.commit(`${namespace}/setHeadersCookie`, context.req, {
    preserveState: hasOwnProperty.call(context.store.state, namespace)
  })
}
