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
  const chunks = useRef<Blob[]>([]);

  const { addChunk, processBatch, clearChunks } = useBatchProcessor({
    onBatchReady: (batch) => {
      if (onAudioData && batch.size > 0) {
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
      if (e.data.size > 0) {
        chunks.current.push(e.data);
        addChunk(e.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      processBatch();
      if (chunks.current.length > 0) {
        const finalBlob = new Blob(chunks.current, { type: 'audio/webm' });
        console.log('Final recording blob size:', finalBlob.size);
        onRecordingComplete(finalBlob);
        chunks.current = [];
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
    chunks.current = []; // Reset chunks array
    await startStream();
  };

  const stopRecording = () => {
    console.log('Stopping recording with overlap handling...');
    
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current);
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }

    stopStream();
    setIsRecording(false);
    console.log('Recording stopped with overlap cleanup');
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};

export default AudioCapture;