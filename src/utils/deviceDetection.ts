export const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  console.log('[DeviceDetection] User Agent:', userAgent);
  
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  console.log('[DeviceDetection] Device type:', { isIOS });
  return { isIOS };
};

export const getBrowserType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  console.log('[BrowserDetection] User Agent:', userAgent);
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor.toLowerCase());
  
  console.log('[BrowserDetection] Browser type:', { isSafari, isChrome });
  return { isSafari, isChrome };
};