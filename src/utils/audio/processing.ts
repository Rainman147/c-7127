export const normalizeAudio = async (audioData: Float32Array): Promise<Float32Array> => {
  const maxAmplitude = Math.max(...audioData.map(Math.abs));
  if (maxAmplitude === 0) return audioData;
  
  const normalizedData = new Float32Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    normalizedData[i] = audioData[i] / maxAmplitude;
  }
  
  return normalizedData;
};

export const applyNoiseGate = (audioData: Float32Array, threshold = 0.01): Float32Array => {
  return audioData.map(sample => Math.abs(sample) < threshold ? 0 : sample);
};

export const getAudioMetadata = async (audioBlob: Blob): Promise<{ duration: number; channels: number; sampleRate: number }> => {
  return new Promise((resolve, reject) => {
    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const metadata = {
          duration: audioBuffer.duration,
          channels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate
        };

        console.log('Audio metadata:', metadata);
        audioContext.close();
        resolve(metadata);
      } catch (error) {
        console.error('Failed to decode audio data:', error);
        audioContext.close();
        reject(new Error('Failed to decode audio file. The file may be corrupted.'));
      }
    };

    reader.onerror = () => {
      console.error('Failed to read audio file:', reader.error);
      reject(new Error('Failed to read audio file.'));
    };

    reader.readAsArrayBuffer(audioBlob);
  });
};