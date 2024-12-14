import { useRef, useCallback } from 'react';

interface BatchProcessorProps {
  onBatchReady: (batch: Blob) => void;
}

export const useBatchProcessor = ({ onBatchReady }: BatchProcessorProps) => {
  const chunks = useRef<Blob[]>([]);
  const lastBatchTime = useRef<number>(0);
  const BATCH_INTERVAL = 5000; // 5 seconds batch interval

  const processBatch = useCallback(() => {
    if (chunks.current.length > 0) {
      console.log(`Processing batch of ${chunks.current.length} chunks`);
      const batchBlob = new Blob(chunks.current, { type: 'audio/webm' });
      onBatchReady(batchBlob);
      chunks.current = [];
      lastBatchTime.current = Date.now();
    }
  }, [onBatchReady]);

  const addChunk = useCallback((chunk: Blob) => {
    chunks.current.push(chunk);
    const now = Date.now();
    if (now - lastBatchTime.current >= BATCH_INTERVAL) {
      processBatch();
    }
  }, [processBatch]);

  const clearChunks = useCallback(() => {
    chunks.current = [];
  }, []);

  return {
    addChunk,
    processBatch,
    clearChunks
  };
};