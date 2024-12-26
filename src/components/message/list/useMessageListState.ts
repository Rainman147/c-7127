import { useState, useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useMessageGrouping } from '@/hooks/chat/useMessageGrouping';
import { usePerformanceMetrics } from '@/hooks/chat/usePerformanceMetrics';
import type { Message } from '@/types/chat';
import type { VariableSizeList as List } from 'react-window';

export const useMessageListState = (messages: Message[]) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const lastMessageRef = useRef<string | null>(null);
  const sizeMap = useRef<{ [key: string]: number }>({});
  const renderStartTime = useRef(performance.now());
  
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  const [listHeight, setListHeight] = useState(0);

  const messageGroups = useMessageGrouping(messages);
  const { metrics: performanceMetrics } = usePerformanceMetrics(
    messages?.length ?? 0,
    messageGroups?.length ?? 0
  );

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setListHeight(height);
      
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'List height updated', {
        height,
        viewportHeight,
        keyboardVisible,
        renderedNodes: performanceMetrics.renderedNodes
      });
    }
  }, [viewportHeight, keyboardVisible, performanceMetrics.renderedNodes]);

  return {
    containerRef,
    listRef,
    lastMessageRef,
    sizeMap,
    renderStartTime,
    viewportHeight,
    connectionState,
    listHeight,
    messageGroups,
    performanceMetrics
  };
};