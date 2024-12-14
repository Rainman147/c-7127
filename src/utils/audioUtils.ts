export const CHUNK_SIZE = 120; // 2 minutes in seconds
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const SUPPORTED_FORMATS = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm'
];

export const validateAudioFile = (file: File | Blob) => {
  console.log('Validating audio file:', {
    type: file.type,
    size: file.size,
    lastModified: file instanceof File ? file.lastModified : 'N/A'
  });

  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error(`Unsupported format: ${file.type}. Please upload a WAV, MP3, M4A, or WebM file.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  if (file.size === 0) {
    throw new Error('Audio file is empty.');
  }
};

export const validateAudioData = (audioData: string) => {
  if (!audioData || audioData.length === 0) {
    throw new Error('Audio data is empty or invalid.');
  }

  try {
    atob(audioData);
  } catch (e) {
    throw new Error('Invalid audio data format.');
  }

  console.log('Audio data validation passed:', {
    dataLength: audioData.length,
    sizeInMB: (audioData.length * 0.75 / (1024 * 1024)).toFixed(2)
  });
};

export const convertWebMToWav = async (webmBlob: Blob): Promise<Blob> => {
  console.log('Converting WebM to WAV:', { size: webmBlob.size, type: webmBlob.type });
  
  const audioContext = new AudioContext({
    sampleRate: 16000 // Required by Whisper API
  });
  
  try {
    // Convert blob to array buffer
    const arrayBuffer = await webmBlob.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      1, // mono
      audioBuffer.length,
      16000 // sample rate
    );
    
    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    
    // Render audio
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV
    const wavData = audioBufferToWav(renderedBuffer);
    const wavBlob = new Blob([wavData], { type: 'audio/wav' });
    
    console.log('Conversion complete:', { 
      originalSize: webmBlob.size,
      wavSize: wavBlob.size,
      sampleRate: renderedBuffer.sampleRate,
      duration: renderedBuffer.duration
    });
    
    return wavBlob;
  } catch (error) {
    console.error('Error converting WebM to WAV:', error);
    throw error;
  } finally {
    await audioContext.close();
  }
};

// Helper function to convert AudioBuffer to WAV format
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const numChannels = 1; // Mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const dataLength = buffer.length * numChannels * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return arrayBuffer;
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
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

export const splitAudioIntoChunks = async (audioBlob: Blob): Promise<Blob[]> => {
  // For now, we'll just return the whole blob as one chunk
  // In a future update, we can implement actual audio chunking using Web Audio API
  return [audioBlob];
};

export const mergeTranscriptions = (transcriptions: string[]): string => {
  return transcriptions.join(' ');
};

// Audio preprocessing utilities
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
