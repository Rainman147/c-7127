export const getDeviceType = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Only log when running in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[DeviceDetection] Device check:', { 
      userAgent: userAgent.substring(0, 50) + '...',
      isIOS 
    });
  }
  
  return { isIOS };
};

export const getBrowserType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor.toLowerCase());
  
  // Only log when running in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[BrowserDetection] Browser check:', { isSafari, isChrome });
  }
  
  return { isSafari, isChrome };
};