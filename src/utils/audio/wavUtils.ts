/**
 * Writes a string to a DataView at a specific offset
 */
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Creates a WAV header for the given audio specifications
 */
const createWavHeader = (
  view: DataView,
  length: number,
  options: {
    sampleRate: number;
    bitsPerSample: number;
    channels: number;
  }
) => {
  const { sampleRate, bitsPerSample, channels } = options;
  const bytesPerSample = bitsPerSample / 8;

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
};

/**
 * Creates a WAV blob from Float32Array chunks
 */
export const createWavBlob = async (
  chunks: Float32Array[], 
  options: {
    sampleRate: number;
    bitsPerSample: number;
    channels: number;
  }
): Promise<Blob> => {
  return new Promise((resolve) => {
    const { bitsPerSample, channels } = options;
    const bytesPerSample = bitsPerSample / 8;
    const length = chunks[0].length;

    const buffer = new ArrayBuffer(44 + length * bytesPerSample * channels);
    const view = new DataView(buffer);

    // Write WAV header
    createWavHeader(view, length, options);

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