import { useState, useRef } from 'react';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useAudioStreamManager } from './capture/AudioStreamManager';
import { useBatchProcessor } from './capture/BatchProcessor';

interface AudioCaptureProps {
  onRecordingComplete: (blob: Blob) => void;
  onAudioData?: (data: Blob) => void;
}

const AudioCapture = ({ onRecordingComplete, onAudioData }: AudioCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout>();
  const { initializeAudioContext, cleanupAudioContext } = useAudioContext();
  const MAX_RECORDING_TIME = 120000; // 2 minutes in milliseconds

  const { addChunk, processBatch, clearChunks } = useBatchProcessor({
    onBatchReady: (batch) => {
      if (onAudioData) {
        console.log('Sending batch for transcription, size:', batch.size);
        onAudioData(batch);
      }
    }
  });

  const handleStreamStart = (stream: MediaStream) => {
    const { source } = initializeAudioContext(stream);
    
    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });
    
    mediaRecorder.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        addChunk(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      processBatch();
      const finalBlob = new Blob([], { type: 'audio/webm' });
      onRecordingComplete(finalBlob);
      clearChunks();
    };

    mediaRecorder.current.start(1000);
    setIsRecording(true);
    console.log('Started recording');

    recordingTimeout.current = setTimeout(() => {
      if (isRecording) {
        stopRecording();
      }
    }, MAX_RECORDING_TIME);
  };

  const { startStream, stopStream } = useAudioStreamManager({
    onStreamStart: handleStreamStart,
    onStreamError: () => setIsRecording(false),
    onStreamStop: () => {
      cleanupAudioContext();
      setIsRecording(false);
    }
  });

  const startRecording = async () => {
    await startStream();
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current);
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }

    stopStream();
    console.log('Recording stopped');
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;