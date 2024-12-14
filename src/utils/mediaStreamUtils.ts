import { AUDIO_SETTINGS } from './audioConfig';

export const getMediaStream = async () => {
  console.log('Requesting microphone access...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_SETTINGS
    });
    console.log('Microphone access granted');
    return stream;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Could not access microphone. Please check permissions.');
  }
};

export const cleanupMediaStream = (stream: MediaStream) => {
  stream.getTracks().forEach(track => track.stop());
  console.log('Media stream cleaned up');
};