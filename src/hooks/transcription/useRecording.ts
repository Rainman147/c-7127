import { useState, useRef } from 'react';
import { getDeviceType, getBrowserType } from '@/utils/deviceDetection';

interface RecordingOptions {
  onError: (error: string) => void;
  onTranscriptionComplete: (text: string) => void;
}

export const useRecording = ({ onError, onTranscriptionComplete }: RecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { isIOS } = getDeviceType();
  const { isChrome } = getBrowserType();

  const getAudioConfig = () => ({
    sampleRate: isIOS ? 44100 : 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(isChrome && {
      latencyHint: 'interactive',
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true
    })
  });

  const startRecording = async () => {
    try {
      const audioConfig = getAudioConfig();
      console.log('Requesting microphone access with config:', audioConfig);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConfig
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
          console.log('Received audio chunk, size:', e.data.size);
        }
      };

      mediaRecorder.current.onstop = async () => {
        try {
          if (chunks.current.length === 0) {
            console.error('No audio data recorded');
            onError('No audio data recorded');
            return;
          }

          const audioBlob = new Blob(chunks.current, { type: mediaRecorder.current?.mimeType });
          console.log('Recording stopped, final blob size:', audioBlob.size);

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            console.log('Sending audio data to transcription service...');
            const { data, error } = await supabase.functions.invoke('transcribe', {
              body: { 
                audioData: base64Audio,
                mimeType: mediaRecorder.current?.mimeType
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

          reader.readAsDataURL(audioBlob);
        } catch (error: any) {
          console.error('Error processing recording:', error);
          onError(error.message || 'Failed to process recording');
        }
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      console.log('Started recording with enhanced audio settings');

    } catch (error: any) {
      console.error('Error starting recording:', error);
      onError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      console.log('Stopping recording...');
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      chunks.current = [];
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};