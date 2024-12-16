export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isDesktop = !isIOS && !isAndroid;
  
  return {
    isIOS,
    isAndroid,
    isDesktop,
    isMobile: isIOS || isAndroid
  };
};

export const getBrowserType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  return {
    isChrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
    isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
    isFirefox: /firefox/.test(userAgent),
    isEdge: /edge/.test(userAgent)
  };
};

export const getOptimalAudioConfig = () => {
  const { isIOS, isAndroid } = getDeviceType();
  const { isSafari } = getBrowserType();

  // iOS-specific configuration
  if (isIOS) {
    return {
      sampleRate: 44100, // iOS preferred sample rate
      channelCount: 1,
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true }
    };
  }

  // Android-specific configuration
  if (isAndroid) {
    return {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
  }

  // Default desktop configuration (currently working)
  return {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  };
};

export const getSupportedMimeType = () => {
  const { isIOS } = getDeviceType();
  
  // Ordered list of MIME types to try
  const mimeTypes = [
    'audio/webm',
    'audio/mp4',
    'audio/wav',
    'audio/ogg'
  ];

  // For iOS, prioritize MP4
  if (isIOS) {
    mimeTypes.unshift('audio/mp4');
  }

  // Find the first supported MIME type
  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log(`Using supported MIME type: ${mimeType}`);
      return mimeType;
    }
  }

  // Fallback to default
  console.log('No preferred MIME types supported, using default');
  return 'audio/webm';
};