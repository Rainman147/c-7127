import { getOptimalAudioConfig, shouldCompressFile } from '../networkUtils';

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

export const compressAudioFile = async (file: File): Promise<Blob> => {
  const shouldCompress = await shouldCompressFile(file.size);
  if (!shouldCompress) {
    console.log('Network conditions optimal, skipping compression');
    return file;
  }

  console.log('Compressing audio file based on network conditions');
  const audioConfig = await getOptimalAudioConfig();
  
  // Create audio context and buffer
  const audioContext = new AudioContext({
    sampleRate: audioConfig.sampleRate
  });
  
  // Convert file to array buffer
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    audioConfig.channelCount,
    audioBuffer.length * (audioConfig.sampleRate / audioBuffer.sampleRate),
    audioConfig.sampleRate
  );
  
  // Create source and connect
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  // Render and create new blob
  const renderedBuffer = await offlineContext.startRendering();
  const chunks: Float32Array[] = [];
  
  // Convert to required format
  for (let channel = 0; channel < renderedBuffer.numberOfChannels; channel++) {
    chunks.push(renderedBuffer.getChannelData(channel));
  }
  
  // Create WAV blob with compressed settings
  const wavBlob = await createWavBlob(chunks, {
    sampleRate: audioConfig.sampleRate,
    bitsPerSample: 16,
    channels: audioConfig.channelCount
  });
  
  console.log('Audio compression complete', {
    originalSize: file.size,
    compressedSize: wavBlob.size,
    compressionRatio: (wavBlob.size / file.size * 100).toFixed(2) + '%'
  });
  
  return wavBlob;
};

export const getAudioMetadata = async (audioBlob: Blob): Promise<{ 
  duration: number; 
  channels: number; 
  sampleRate: number;
  bitrate?: number;
}> => {
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
          sampleRate: audioBuffer.sampleRate,
          bitrate: (audioBlob.size * 8) / audioBuffer.duration // Approximate bitrate
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

// Helper function to create WAV blob
const createWavBlob = async (chunks: Float32Array[], options: {
  sampleRate: number;
  bitsPerSample: number;
  channels: number;
}): Promise<Blob> => {
  return new Promise((resolve) => {
    const { sampleRate, bitsPerSample, channels } = options;
    const bytesPerSample = bitsPerSample / 8;
    const length = chunks[0].length;

    const buffer = new ArrayBuffer(44 + length * bytesPerSample * channels);
    const view = new DataView(buffer);

    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length * bytesPerSample * channels, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length * bytesPerSample * channels, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = Math.max(-1, Math.min(1, chunks[channel][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + (i * channels + channel) * bytesPerSample, value, true);
      }
    }

    resolve(new Blob([buffer], { type: 'audio/wav' }));
  });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};