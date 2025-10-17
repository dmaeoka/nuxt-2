export const devicesMap = {
  isTablet: 'web_vuejs_tablet',
  isMobile: 'web_vuejs_mobile',
}

// Returns the first matching value from the devicesMap object
export function getDeviceCode (context) {
  const device = context.$device
  const isMobileApp = context.store.getters.getIsMobileApp
  if (isMobileApp) {
    if (device.isAndroid) {
      return 'web_vuejs_android'
    }
    if (device.isIos) {
      return 'web_vuejs_ios'
    }
  }

  for (const key in devicesMap) {
    if (device[key]) {
      return devicesMap[key]
    }
  }

  return 'web_vuejs_desktop'
}

export function getEncapsulatedDeviceCode (context) {
  // Encapsulated Mobile App use channel querystring to set device or android if not defined.
  const isMobileAppEncapsulated = context.store.getters?.getIsMobileAppEncapsulated || false
  if (!isMobileAppEncapsulated) {
    return getDeviceCode(context)
  }

  const channel = context.store.getters?.getDeviceChannel

  switch (channel?.toLowerCase()) {
    case 'web':
      return 'web_vuejs_desktop'
    case 'mobile':
      return 'web_vuejs_mobile'
    case 'android':
      return 'web_vuejs_android'
    case 'ios':
      return 'web_vuejs_ios'
    default:
      return 'web_vuejs_android'
  }
}
