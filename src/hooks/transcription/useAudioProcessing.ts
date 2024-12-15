import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AudioPayload } from './types';
import { useToast } from '@/hooks/use-toast';

interface AudioProcessingOptions {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export const useAudioProcessing = ({ onTranscriptionComplete, onError }: AudioProcessingOptions) => {
  const [liveTranscription, setLiveTranscription] = useState('');
  const { toast } = useToast();
  
  const processAudioData = async (audioData: string, mimeType: string): Promise<string> => {
    console.log('Processing audio data...');
    const payload: AudioPayload = {
      audioData,
      metadata: {
        mimeType,
        streaming: true
      }
    };

    try {
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: payload
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      if (!data?.transcription) {
        throw new Error('No transcription received');
      }

      console.log('Transcription received:', data.transcription);
      return data.transcription;
    } catch (error: any) {
      console.error('Audio processing error:', error);
      onError(error.message || 'Failed to process audio');
      throw error;
    }
  };

  const updateTranscription = useCallback((newText: string) => {
    setLiveTranscription(prev => {
      const updated = prev + (prev ? ' ' : '') + newText;
      return updated;
    });
  }, []);

  const startRecording = useCallback(async () => {
    console.log('Starting recording from useAudioProcessing...');
    try {
      // Implementation will be handled by RecordingManager
      return true;
    } catch (error: any) {
      console.error('Start recording error:', error);
      onError(error.message);
      return false;
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording from useAudioProcessing...');
    try {
      // Implementation will be handled by RecordingManager
      return true;
    } catch (error: any) {
      console.error('Stop recording error:', error);
      onError(error.message);
      return false;
    }
  }, [onError]);

  const handleFileUpload = useCallback(async (file: File) => {
    console.log('Handling file upload from useAudioProcessing...');
    try {
      // File processing logic will be implemented here
      toast({
        title: "Processing audio file",
        description: "Please wait while we process your audio file...",
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      onError(error.message);
    }
  }, [onError, toast]);

  return {
    processAudioData,
    updateTranscription,
    liveTranscription,
    startRecording,
    stopRecording,
    handleFileUpload
  };
};