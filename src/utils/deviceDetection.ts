let deviceChecked = false;
let deviceInfo = { isIOS: false };

export const getDeviceType = () => {
  // Only perform check once per session
  if (!deviceChecked) {
    const userAgent = navigator.userAgent;
    deviceInfo.isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DeviceDetection] Initial device check:', { 
        userAgent: userAgent.substring(0, 50) + '...',
        isIOS: deviceInfo.isIOS 
      });
    }
    deviceChecked = true;
  }
  
  return deviceInfo;
};

let browserChecked = false;
let browserInfo = { isSafari: false, isChrome: false };

export const getBrowserType = () => {
  // Only perform check once per session
  if (!browserChecked) {
    const userAgent = navigator.userAgent.toLowerCase();
    browserInfo.isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    browserInfo.isChrome = /chrome/.test(userAgent) && /google inc/.test(navigator.vendor.toLowerCase());
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[BrowserDetection] Initial browser check:', browserInfo);
    }
    browserChecked = true;
  }
  
  return browserInfo;
};