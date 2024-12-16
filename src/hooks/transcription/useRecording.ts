import { useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManagement } from './useSessionManagement';
import { useChunkProcessing } from './useChunkProcessing';
import { useToast } from '@/hooks/use-toast';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { recordingSessionId, createSession, clearSession, handleSessionError } = useSessionManagement();

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using supported MIME type:', type);
        return type;
      }
    }
    
    console.warn('No preferred MIME types supported, falling back to browser default');
    return '';
  };

  const handleDataAvailable = useCallback(async (event: BlobEvent) => {
    if (event.data.size > 0) {
      console.log('Recording chunk received:', {
        size: event.data.size,
        type: event.data.type
      });
      
      chunksRef.current = [...chunksRef.current, event.data];

      try {
        const formData = new FormData();
        formData.append('chunk', event.data);
        formData.append('totalChunks', '1');

        const { error } = await supabase.functions.invoke('backup-audio-chunk', {
          body: formData
        });

        if (error) {
          console.error('Error saving chunk:', error);
          throw error;
        }
      } catch (error: any) {
        console.error('Error handling audio chunk:', error);
        onError(error.message);
      }
    }
  }, [onError]);

  const startRec = useCallback(async () => {
    try {
      const sessionId = createSession();
      console.log('Starting new recording session:', sessionId);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      setCurrentStream(stream);
      chunksRef.current = []; // Reset chunks array
      
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000
      });

      recorder.ondataavailable = handleDataAvailable;
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError('Recording failed');
      };

      recorder.start(5000); // Chunk every 5 seconds
      mediaRecorderRef.current = recorder;
      console.log('MediaRecorder started with mime type:', mimeType);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      handleSessionError(error);
      onError(error.message);
      
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      }
    }
  }, [createSession, handleDataAvailable, handleSessionError, onError]);

  const stopRec = useCallback(async () => {
    console.log('Stopping recording session:', recordingSessionId);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }

    if (!recordingSessionId || chunksRef.current.length === 0) {
      console.warn('No chunks recorded or no active session');
      onError('No audio recorded');
      return;
    }

    try {
      // Update the total chunks count for all saved chunks
      const { data: savedChunks, error: fetchError } = await supabase
        .from('audio_chunks')
        .select('*')
        .eq('storage_path', `chunks/${recordingSessionId}/%`)
        .order('chunk_number', { ascending: true });

      if (fetchError) throw fetchError;

      if (!savedChunks || savedChunks.length === 0) {
        throw new Error('No audio chunks found for transcription');
      }

      console.log(`Found ${savedChunks.length} chunks for transcription`);

      // Transcribe the complete audio
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe-chunks', {
        body: { 
          sessionId: recordingSessionId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (transcriptionError) throw transcriptionError;

      if (transcriptionData?.transcription) {
        console.log('Transcription complete:', transcriptionData.transcription);
        onTranscriptionComplete(transcriptionData.transcription);
        
        toast({
          title: "Transcription complete",
          description: "Your audio has been transcribed successfully.",
          duration: 3000,
        });
      } else {
        throw new Error('No transcription received');
      }

    } catch (error: any) {
      console.error('Error stopping recording:', error);
      onError(error.message);
      
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      chunksRef.current = [];
      clearSession();
      mediaRecorderRef.current = null;
    }
  }, [recordingSessionId, clearSession, onError, onTranscriptionComplete, toast]);

  return {
    isRecording: Boolean(currentStream),
    startRecording: startRec,
    stopRecording: stopRec
  };
};