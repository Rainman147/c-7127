import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioContext } from '@/hooks/useAudioContext';
import { getMediaStream, cleanupMediaStream } from '@/utils/mediaStreamUtils';

interface AudioCaptureProps {
  onRecordingComplete: (blob: Blob) => void;
  onAudioData?: (data: Blob) => void;
}

const AudioCapture = ({ onRecordingComplete, onAudioData }: AudioCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const lastBatchTime = useRef<number>(0);
  const { toast } = useToast();
  const { initializeAudioContext, cleanupAudioContext } = useAudioContext();
  const BATCH_INTERVAL = 5000; // 5 seconds batch interval

  const processBatch = useCallback(() => {
    if (chunks.current.length > 0) {
      console.log(`Processing batch of ${chunks.current.length} chunks`);
      const batchBlob = new Blob(chunks.current, { type: 'audio/webm' });
      
      if (onAudioData) {
        console.log('Sending batch for transcription, size:', batchBlob.size);
        onAudioData(batchBlob);
      }
      
      chunks.current = []; // Clear processed chunks
      lastBatchTime.current = Date.now();
    }
  }, [onAudioData]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await getMediaStream();
      console.log('Microphone access granted');
      
      const { source } = initializeAudioContext(stream);
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      chunks.current = [];
      lastBatchTime.current = Date.now();

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
          
          // Process batch if enough time has passed
          const now = Date.now();
          if (now - lastBatchTime.current >= BATCH_INTERVAL) {
            processBatch();
          }
        }
      };

      mediaRecorder.current.onstop = () => {
        // Process any remaining chunks
        processBatch();
        
        // Create final blob with all remaining data
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        chunks.current = [];
      };

      mediaRecorder.current.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Started recording');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [initializeAudioContext, onRecordingComplete, onAudioData, toast, processBatch]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }

    cleanupAudioContext();
    setIsRecording(false);
    console.log('Recording stopped');
  }, [cleanupAudioContext]);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;