interface WAVConverterProps {
  blob: Blob;
  onConversionComplete: (wavBlob: Blob) => void;
}

const WAVConverter = async ({ blob, onConversionComplete }: WAVConverterProps) => {
  if (blob.type === 'audio/wav') {
    onConversionComplete(blob);
    return;
  }

  try {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create WAV blob
    const wavBlob = await new Promise<Blob>((resolve) => {
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length * numberOfChannels * 2;
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);
      
      // WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, audioBuffer.sampleRate, true);
      view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
      view.setUint16(32, numberOfChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);
      
      // Audio data
      const channelData = audioBuffer.getChannelData(0);
      let offset = 44;
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
      
      resolve(new Blob([buffer], { type: 'audio/wav' }));
    });
    
    onConversionComplete(wavBlob);
    console.log('Converted to WAV:', { size: wavBlob.size });
  } catch (error) {
    console.error('Error converting to WAV:', error);
    throw error;
  }
};

// Helper function to write strings to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export default WAVConverter;