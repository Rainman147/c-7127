export const convertWebMToWav = async (webmBlob: Blob): Promise<Blob> => {
  console.log('Converting WebM to WAV:', { size: webmBlob.size, type: webmBlob.type });
  
  // Create audio context with specific settings for Whisper API
  const audioContext = new AudioContext({
    sampleRate: 16000 // Required by Whisper API
  });
  
  try {
    // Convert blob to array buffer with detailed logging
    const arrayBuffer = await webmBlob.arrayBuffer();
    console.log('WebM converted to ArrayBuffer:', { 
      size: arrayBuffer.byteLength,
      type: webmBlob.type 
    });
    
    // Decode the audio data with error handling
    let audioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio successfully decoded:', {
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });
    } catch (decodeError) {
      console.error('Failed to decode audio:', decodeError);
      throw new Error('Unable to decode audio data. Please try recording again.');
    }
    
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
    console.log('Audio rendered successfully:', {
      duration: renderedBuffer.duration,
      sampleRate: renderedBuffer.sampleRate
    });
    
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