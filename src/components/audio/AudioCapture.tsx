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
  const CHUNK_DURATION = 5000; // 5 seconds per chunk
  const OVERLAP_DURATION = 2000; // 2 seconds overlap

  const { addChunk, processBatch, clearChunks } = useBatchProcessor({
    onBatchReady: (batch) => {
      if (onAudioData && isRecording) { // Only process if still recording
        console.log('Sending batch for transcription with overlap, size:', batch.size);
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
      if (e.data.size > 0 && isRecording) { // Only add chunks if still recording
        addChunk(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      if (isRecording) { // Only process final batch if was recording
        processBatch();
        const finalBlob = new Blob([], { type: 'audio/webm' });
        onRecordingComplete(finalBlob);
      }
      clearChunks();
    };

    // Start recording with shorter timeslice for more frequent chunks
    mediaRecorder.current.start(CHUNK_DURATION - OVERLAP_DURATION);
    setIsRecording(true);
    console.log('Started recording with overlap configuration');

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
    console.log('Stopping recording with overlap handling...');
    
    // Set isRecording to false first to prevent further processing
    setIsRecording(false);
    
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current);
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }

    stopStream();
    clearChunks(); // Clear any remaining chunks
    console.log('Recording stopped with overlap cleanup');
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;