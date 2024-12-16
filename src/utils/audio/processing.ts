import { getOptimalAudioConfig, shouldCompressFile } from '../networkUtils';
import { createWavBlob } from './wavUtils';
import { normalizeAudio, applyNoiseGate } from './audioProcessing';

/**
 * Compresses an audio file based on network conditions
 */
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
    const channelData = renderedBuffer.getChannelData(channel);
    const normalizedData = await normalizeAudio(channelData);
    const processedData = applyNoiseGate(normalizedData);
    chunks.push(processedData);
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

/**
 * Gets metadata for an audio blob
 */
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