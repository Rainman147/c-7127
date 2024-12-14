import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deidentifyText, secureLog } from '@/utils/securityUtils';
import { supabase } from '@/integrations/supabase/client';
import { validateAudioData, validateAudioFile, getAudioMetadata } from '@/utils/audioUtils';

interface UseTranscriptionProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
}

interface AudioPayload {
  audioData: string;
  metadata: {
    duration?: number;
    sampleRate?: number;
    channels?: number;
    mimeType: string;
    streaming: boolean;
  }
}

export const useTranscription = ({ 
  onTranscriptionComplete, 
  onTranscriptionUpdate 
}: UseTranscriptionProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const { toast } = useToast();
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const handleTranscriptionError = async (error: any, retryCallback: () => void) => {
    secureLog('Transcription error:', { error: error.message });
    
    if (retryCount < MAX_RETRIES) {
      setIsReconnecting(true);
      toast({
        title: "Connection lost",
        description: `Attempting to reconnect... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
        variant: "default",
      });
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      setRetryCount(prev => prev + 1);
      retryCallback();
      return true;
    }
    
    setIsReconnecting(false);
    setRetryCount(0);
    toast({
      title: "Error",
      description: "Failed to transcribe audio after multiple attempts. Please try again.",
      variant: "destructive",
    });
    return false;
  };

  const validatePayload = (payload: AudioPayload): boolean => {
    if (!payload.audioData) {
      throw new Error('Audio data is missing from payload');
    }

    if (!payload.metadata) {
      throw new Error('Metadata is missing from payload');
    }

    if (!payload.metadata.mimeType) {
      throw new Error('MIME type is missing from metadata');
    }

    console.log('Payload validation passed:', {
      metadataPresent: !!payload.metadata,
      audioDataLength: payload.audioData.length,
      mimeType: payload.metadata.mimeType,
      streaming: payload.metadata.streaming,
      duration: payload.metadata.duration,
      sampleRate: payload.metadata.sampleRate,
      channels: payload.metadata.channels
    });

    return true;
  };

  const handleAudioData = async (data: string) => {
    try {
      // Validate the audio data before processing
      validateAudioData(data);
      
      secureLog('Sending audio chunk', { chunkSize: data.length });
      
      // Convert base64 to blob for metadata extraction
      const binaryData = atob(data);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/x-raw' });
      
      // Validate the audio blob
      validateAudioFile(audioBlob);
      
      // Get audio metadata
      let metadata = {
        mimeType: 'audio/x-raw',
        streaming: true
      };

      try {
        const audioMetadata = await getAudioMetadata(audioBlob);
        metadata = {
          ...metadata,
          ...audioMetadata
        };
      } catch (error) {
        console.warn('Could not extract audio metadata:', error);
      }

      // Construct and validate payload
      const payload: AudioPayload = {
        audioData: data,
        metadata
      };

      // Log payload before validation
      console.log('Preparing payload for Edge Function:', {
        payloadSize: data.length,
        metadata: payload.metadata
      });

      // Validate payload structure
      validatePayload(payload);
      
      const { data: result, error } = await supabase.functions.invoke('transcribe', {
        body: payload
      });

      if (error) {
        throw error;
      }

      secureLog('Transcription received', { hasTranscription: !!result?.transcription });
      
      if (result?.transcription) {
        const newTranscription = deidentifyText(result.transcription.trim());
        setLiveTranscription(prev => {
          const updated = prev + (prev ? ' ' : '') + newTranscription;
          onTranscriptionUpdate?.(updated);
          return updated;
        });
      }

      if (retryCount > 0) {
        setRetryCount(0);
        setIsReconnecting(false);
        toast({
          title: "Connection restored",
          description: "Transcription has resumed successfully.",
          variant: "default",
        });
      }
    } catch (error) {
      await handleTranscriptionError(error, () => handleAudioData(data));
    }
  };

  return {
    handleAudioData,
    isReconnecting,
    liveTranscription,
    retryCount
  };
};