
const { resolve, join } = require('path')
const { readdirSync } = require('fs')

export default function (moduleOptions) {
  // get all options for the module
  const options = {
    ...moduleOptions,
  }

  if (!options.version) {
    options.version = ''
  }
  if (!options.device) {
    options.device = ''
  }
  if (!options.baseUrl) {
    options.baseUrl = 'https://127.0.0.1/'
  }
  if (!options.namespace) {
    options.namespace = 'UFWSClient'
  }
  if (!options.locale) {
    options.locale = 'fr'
  }
  if (!options.timezone) {
    options.timezone = '+1'
  }
  const { namespace } = options

  const pluginsToSync = [
    './store/index.js',
    './components/index.js',
    './plugins/index.js',
  ]

  for (const pathString of pluginsToSync) {
    this.addPlugin({
      src: resolve(__dirname, pathString),
      fileName: join(namespace, pathString),
      options
    })
  }

  // sync all of the files and folders to revelant places in the nuxt build dir (.nuxt/)
  const foldersToSync = ['store/modules', 'components/lib', 'plugins', 'models']
  for (const pathString of foldersToSync) {
    const path = resolve(__dirname, pathString)
    for (const file of readdirSync(path)) {
      this.addTemplate({
        src: resolve(path, file),
        fileName: join(namespace, pathString, file),
        options
      })
    }
  }
}

module.exports.meta = require('./package.json')
