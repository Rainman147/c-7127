import { useRef, useCallback } from 'react';
import { AUDIO_SETTINGS } from '@/utils/audioConfig';

export const useAudioContext = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const processor = useRef<ScriptProcessorNode | null>(null);

  const initializeAudioContext = useCallback((stream: MediaStream) => {
    console.log('Initializing audio context...');
    audioContext.current = new AudioContext({ sampleRate: AUDIO_SETTINGS.sampleRate });
    const source = audioContext.current.createMediaStreamSource(stream);
    processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
    
    return { source, processor: processor.current };
  }, []);

  const cleanupAudioContext = useCallback(() => {
    if (processor.current) {
      processor.current.disconnect();
      processor.current = null;
    }

    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    console.log('Audio context cleaned up');
  }, []);

  return {
    initializeAudioContext,
    cleanupAudioContext
  };
};