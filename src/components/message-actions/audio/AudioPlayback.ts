interface AudioContextType extends AudioContext {
  webkitAudioContext?: typeof AudioContext;
}

interface WindowWithAudioContext extends Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export const createAudioContext = async (): Promise<AudioContext> => {
  console.log('[TTS-Playback] Creating AudioContext');
  
  // Define the AudioContext constructor with proper typing
  const AudioContextConstructor = (window as WindowWithAudioContext).AudioContext || 
    (window as WindowWithAudioContext).webkitAudioContext;
  
  if (!AudioContextConstructor) {
    throw new Error('AudioContext not supported in this browser');
  }
  
  const audioContext = new AudioContextConstructor({
    latencyHint: 'interactive',
    sampleRate: 44100
  });
  
  if (audioContext.state === 'suspended') {
    console.log('[TTS-Playback] Resuming suspended audio context');
    await audioContext.resume();
  }
  
  console.log('[TTS-Playback] Audio context created:', {
    state: audioContext.state,
    sampleRate: audioContext.sampleRate,
    baseLatency: audioContext.baseLatency
  });
  
  return audioContext;
};

export const scheduleAudioPlayback = async (
  audioContext: AudioContext,
  audioBuffer: AudioBuffer,
  startTime: number,
  isFirstChunk: boolean,
  onEnded?: () => void
): Promise<number> => {
  console.log('[TTS-Playback] Scheduling audio chunk:', {
    duration: audioBuffer.duration,
    startTime,
    isFirstChunk
  });

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create and configure audio processing nodes
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1.0;
  
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  
  // Connect the audio graph
  source
    .connect(gainNode)
    .connect(compressor)
    .connect(audioContext.destination);

  const actualStartTime = isFirstChunk ? audioContext.currentTime : startTime;
  source.start(actualStartTime);
  
  console.log('[TTS-Playback] Audio scheduled:', {
    actualStartTime,
    contextTime: audioContext.currentTime
  });

  if (onEnded) {
    source.onended = () => {
      console.log('[TTS-Playback] Chunk playback ended');
      onEnded();
    };
  }

  return actualStartTime + audioBuffer.duration;
};