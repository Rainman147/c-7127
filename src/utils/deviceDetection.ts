let deviceTypeCache: { isIOS: boolean } | null = null;
let browserTypeCache: { isSafari: boolean; isChrome: boolean } | null = null;

export const getDeviceType = () => {
  if (deviceTypeCache) {
    return deviceTypeCache;
  }

  const userAgent = navigator.userAgent;
  console.log('[DeviceDetection] User Agent:', userAgent);
  
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  deviceTypeCache = { isIOS };
  console.log('[DeviceDetection] Device type:', deviceTypeCache);
  return deviceTypeCache;
};

export const getBrowserType = () => {
  if (browserTypeCache) {
    return browserTypeCache;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  console.log('[BrowserDetection] User Agent:', userAgent);
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor.toLowerCase());
  
  browserTypeCache = { isSafari, isChrome };
  console.log('[BrowserDetection] Browser type:', browserTypeCache);
  return browserTypeCache;
};