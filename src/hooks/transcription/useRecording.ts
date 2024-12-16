import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManagement } from './useSessionManagement';
import { useChunkProcessing } from './useChunkProcessing';
import { useToast } from '@/hooks/use-toast';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { recordingSessionId, createSession, clearSession, handleSessionError } = useSessionManagement();
  const { processChunk } = useChunkProcessing();

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
        type: event.data.type,
        sessionId: recordingSessionId
      });
      
      chunksRef.current.push(event.data);
      const chunkNumber = chunksRef.current.length;

      try {
        // Get the current user's ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Create a file path with user ID and session ID
        const timestamp = Date.now();
        const fileName = `${user.id}/${recordingSessionId}/${chunkNumber}.webm`;
        
        console.log('Uploading chunk to storage path:', fileName);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(fileName, event.data, {
            contentType: 'audio/webm',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload audio chunk');
        }

        console.log('Successfully uploaded chunk:', fileName);

        // Process the chunk
        const formData = new FormData();
        formData.append('chunk', event.data);
        formData.append('sessionId', recordingSessionId || '');
        formData.append('chunkNumber', chunkNumber.toString());

        await processChunk(event.data, recordingSessionId || '');

      } catch (error: any) {
        console.error('Error handling audio chunk:', error);
        onError(error.message);
        toast({
          title: "Error",
          description: "Failed to process audio chunk. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [recordingSessionId, onError, processChunk, toast]);

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

      recorder.start(5000); // Chunk every 5 seconds for optimal processing
      mediaRecorderRef.current = recorder;
      console.log('MediaRecorder started with mime type:', mimeType);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      handleSessionError(error);
      onError(error.message);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive"
      });
    }
  }, [createSession, handleDataAvailable, handleSessionError, onError, toast]);

  const stopRec = useCallback(async () => {
    console.log('Stopping recording session:', recordingSessionId);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (!recordingSessionId || chunksRef.current.length === 0) {
      console.warn('No chunks recorded or no active session');
      onError('No audio recorded');
      return;
    }

    try {
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
          title: "Success",
          description: "Audio transcribed successfully",
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
    isRecording: Boolean(mediaRecorderRef.current?.state === 'recording'),
    startRecording: startRec,
    stopRecording: stopRec
  };
};