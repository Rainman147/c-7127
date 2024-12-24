import { useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useScrollMetrics } from './ScrollManagerMetrics';

export const useMessageListMetrics = () => {
  const renderStartTime = useRef(performance.now());
  const metrics = useScrollMetrics(null); // Pass null since we don't need container ref here

  return {
    renderStartTime,
    metrics
  };
};