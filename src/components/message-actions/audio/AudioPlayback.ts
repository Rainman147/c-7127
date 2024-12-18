export const createAudioContext = async (chunks: ArrayBuffer[]): Promise<AudioContext> => {
  console.log('[TTS-Playback] Creating AudioContext');
  const audioContext = new AudioContext();
  
  console.log('[TTS-Playback] Audio context state:', audioContext.state);
  console.log('[TTS-Playback] Sample rate:', audioContext.sampleRate);
  
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
  source.connect(audioContext.destination);

  if (isFirstChunk) {
    console.log('[TTS-Playback] Starting first chunk immediately');
    source.start(0);
  } else {
    console.log('[TTS-Playback] Scheduling chunk at:', startTime);
    source.start(startTime);
  }

  if (onEnded) {
    source.onended = () => {
      console.log('[TTS-Playback] Chunk playback ended');
      onEnded();
    };
  }

  return startTime + audioBuffer.duration;
};