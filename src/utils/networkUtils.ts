export const getNetworkInfo = async (): Promise<{
  type: string;
  downlink: number;
  rtt: number;
  effectiveType: string;
}> => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      type: connection.type,
      downlink: connection.downlink, // Mb/s
      rtt: connection.rtt, // Round trip time in ms
      effectiveType: connection.effectiveType // 'slow-2g', '2g', '3g', '4g', '5g'
    };
  }
  
  // Fallback values if Network Information API is not supported
  return {
    type: 'unknown',
    downlink: 10, // Assume decent connection
    rtt: 50,
    effectiveType: '4g'
  };
};

export const getOptimalAudioConfig = async () => {
  const network = await getNetworkInfo();
  
  // Adjust audio quality based on network conditions
  if (network.effectiveType === '5g' || network.downlink > 10) {
    return {
      sampleRate: 48000,
      channelCount: 2,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
  } else if (network.effectiveType === '4g' || network.downlink > 5) {
    return {
      sampleRate: 44100,
      channelCount: 2,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
  } else {
    return {
      sampleRate: 22050,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
  }
};

export const shouldCompressFile = async (fileSize: number): Promise<boolean> => {
  const network = await getNetworkInfo();
  const SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  
  // Don't compress on 5G unless file is very large
  if (network.effectiveType === '5g') {
    return fileSize > SIZE_THRESHOLD * 2;
  }
  
  // Compress on slower networks if file exceeds threshold
  return fileSize > SIZE_THRESHOLD;
};