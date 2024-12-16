import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
  audioConfig?: MediaTrackConstraints;
}

export const useRecording = ({ onError, onTranscriptionComplete, audioConfig }: RecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();
  const chunks: Blob[] = [];

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access with config:', audioConfig);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConfig || {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log('Received audio chunk, size:', e.data.size);
        }
      };

      recorder.onstop = async () => {
        try {
          if (chunks.length === 0) {
            console.error('No audio data recorded');
            onError('No audio data recorded');
            return;
          }

          const audioBlob = new Blob(chunks, { type: recorder.mimeType });
          console.log('Recording stopped, final blob size:', audioBlob.size);

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            console.log('Sending audio data to transcription service...');
            const { data, error } = await supabase.functions.invoke('transcribe', {
              body: { 
                audioData: base64Audio,
                mimeType: recorder.mimeType
              }
            });

            if (error) {
              console.error('Transcription error:', error);
              onError(error.message);
              return;
            }

            if (data?.transcription) {
              console.log('Transcription received:', data.transcription);
              onTranscriptionComplete(data.transcription);
            } else {
              onError('No transcription received from the service');
            }
          };

          reader.onerror = () => {
            console.error('Error reading audio file:', reader.error);
            onError('Failed to process audio file');
          };

          reader.readAsDataURL(audioBlob);
        } catch (error: any) {
          console.error('Error processing recording:', error);
          onError(error.message || 'Failed to process recording');
        }
      };

      setMediaRecorder(recorder);
      recorder.start(1000); // Start recording in 1-second chunks
      setIsRecording(true);
      console.log('Started recording with enhanced audio settings');

    } catch (error: any) {
      console.error('Error starting recording:', error);
      onError('Could not access microphone. Please check permissions.');
    }
  }, [onError, onTranscriptionComplete, audioConfig]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Stopping recording...');
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  }, [mediaRecorder]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};