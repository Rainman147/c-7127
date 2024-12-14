import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AudioPayload } from './types';

export const useAudioProcessing = () => {
  const [liveTranscription, setLiveTranscription] = useState('');

  const processAudioData = async (audioData: string): Promise<string> => {
    const payload: AudioPayload = {
      audioData,
      metadata: {
        mimeType: 'audio/webm',
        streaming: true
      }
    };

    const { data, error } = await supabase.functions.invoke('transcribe', {
      body: payload
    });

    if (error) {
      throw error;
    }

    if (!data?.transcription) {
      throw new Error('No transcription received');
    }

    return data.transcription;
  };

  const updateTranscription = (newText: string) => {
    setLiveTranscription(prev => {
      const updated = prev + (prev ? ' ' : '') + newText;
      return updated;
    });
  };

  return {
    processAudioData,
    updateTranscription,
    liveTranscription
  };
};