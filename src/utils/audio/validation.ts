export const validateAudioFile = (file: File | Blob) => {
  console.log('Validating audio file:', {
    type: file.type,
    size: file.size,
    lastModified: file instanceof File ? file.lastModified : 'N/A'
  });

  // Whisper API supported formats
  const SUPPORTED_FORMATS = [
    'audio/mp3',
    'audio/mpeg',
    'audio/mpga',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/webm'
  ];

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper's limit)

  if (!SUPPORTED_FORMATS.includes(file.type)) {
    throw new Error(
      `Unsupported format: ${file.type}. Please upload one of the following formats: MP3, MP4, M4A, WAV, or WEBM.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`
    );
  }

  if (file.size === 0) {
    throw new Error('Audio file is empty.');
  }

  console.log('Audio file validation passed:', {
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
  });
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