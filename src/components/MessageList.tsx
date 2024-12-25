import { memo, useRef, useState, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { ErrorMetadata } from '@/types/errorTracking';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { ConnectionStatus } from './message/ConnectionStatus';
import { MessageGroup } from './message/MessageGroup';
import { useScrollHandler } from './message/ScrollHandler';
import { useMessageGrouping } from '@/hooks/chat/useMessageGrouping';
import { usePerformanceMetrics } from '@/hooks/chat/usePerformanceMetrics';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

const PERFORMANCE_WARNING_THRESHOLD = 100; // ms
const SIZE_MEASURE_WARNING = 1; // ms

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const lastMessageRef = useRef<string | null>(null);
  const sizeMap = useRef<{ [key: string]: number }>({});
  const renderStartTime = useRef(performance.now());
  
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  const { toast } = useToast();
  const [listHeight, setListHeight] = useState(0);

  const messageGroups = useMessageGrouping(propMessages);
  
  const { metrics: scrollMetrics } = useScrollHandler({
    messages: propMessages,
    viewportHeight,
    keyboardVisible,
    connectionState,
    containerRef
  });

  const { metrics: performanceMetrics } = usePerformanceMetrics(
    propMessages?.length ?? 0,
    messageGroups?.length ?? 0
  );

  // Performance monitoring for initial render
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > PERFORMANCE_WARNING_THRESHOLD) {
      const metadata: ErrorMetadata = {
        component: 'MessageList',
        severity: 'medium', // Changed from 'warning' to 'medium'
        errorType: 'performance',
        operation: 'initial-render',
        timestamp: new Date().toISOString(), // Added timestamp
        additionalInfo: {
          renderTime,
          messageCount: propMessages?.length,
          groupCount: messageGroups?.length,
          renderedNodes: performanceMetrics.renderedNodes
        }
      };
      
      ErrorTracker.trackError(
        new Error(`Slow initial render detected: ${renderTime.toFixed(2)}ms`),
        metadata
      );
      
      toast({
        title: 'Performance Warning',
        description: 'Message list rendering is slower than expected. Consider reducing message count.',
        variant: 'destructive'
      });
    }
  }, [propMessages?.length, messageGroups?.length, performanceMetrics.renderedNodes, toast]);

  // Monitor resize observer performance
  useEffect(() => {
    if (containerRef.current) {
      const resizeStartTime = performance.now();
      const height = containerRef.current.clientHeight;
      setListHeight(height);
      
      const resizeTime = performance.now() - resizeStartTime;
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'List height updated', {
        height,
        viewportHeight,
        keyboardVisible,
        resizeTime,
        renderedNodes: performanceMetrics.renderedNodes
      });

      if (resizeTime > PERFORMANCE_WARNING_THRESHOLD) {
        logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Slow resize operation', {
          resizeTime,
          height,
          messageCount: propMessages?.length
        });
      }
    }
  }, [viewportHeight, keyboardVisible, performanceMetrics.renderedNodes, propMessages?.length]);

  // Enhanced error tracking for duplicate messages
  const lastMessage = propMessages[propMessages.length - 1];
  if (lastMessage && lastMessage.id === lastMessageRef.current) {
    const metadata: ErrorMetadata = {
      component: 'MessageList',
      severity: 'medium',
      errorType: 'data',
      operation: 'message-deduplication',
      timestamp: new Date().toISOString(), // Added timestamp
      additionalInfo: {
        messageId: lastMessage.id,
        duplicateCount: propMessages.filter(m => m.id === lastMessage.id).length,
        renderedNodes: performanceMetrics.renderedNodes
      }
    };

    ErrorTracker.trackError(new Error('Duplicate message detected'), metadata);
  } else if (lastMessage) {
    lastMessageRef.current = lastMessage.id;
  }

  // Monitor virtual list performance
  const getItemSize = (index: number) => {
    const startTime = performance.now();
    const groupId = messageGroups[index]?.id;
    if (!groupId) return 100; // Default height
    
    const size = sizeMap.current[groupId] || 100;
    const measureTime = performance.now() - startTime;
    
    if (measureTime > SIZE_MEASURE_WARNING) {
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Slow size measurement', {
        groupId,
        size,
        measureTime,
        index,
        totalGroups: messageGroups.length
      });
    }
    
    return size;
  };

  const setItemSize = (index: number, size: number) => {
    const groupId = messageGroups[index]?.id;
    if (groupId && sizeMap.current[groupId] !== size) {
      const updateStartTime = performance.now();
      sizeMap.current[groupId] = size;
      
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
        const updateTime = performance.now() - updateStartTime;
        
        logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Size cache updated', {
          groupId,
          size,
          index,
          updateTime,
          cacheSize: Object.keys(sizeMap.current).length
        });

        if (updateTime > PERFORMANCE_WARNING_THRESHOLD) {
          logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Slow size cache update', {
            updateTime,
            cacheSize: Object.keys(sizeMap.current).length,
            messageCount: propMessages?.length
          });
        }
      }
    }
  };

  if (!Array.isArray(propMessages) || propMessages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden chat-scrollbar pb-[180px] pt-4 px-4"
    >
      <ConnectionStatus />
      <List
        ref={listRef}
        height={listHeight || viewportHeight}
        itemCount={messageGroups.length}
        itemSize={getItemSize}
        width="100%"
        className="chat-scrollbar"
        overscanCount={2}
      >
        {({ index, style }) => (
          <div style={style}>
            <MessageGroup 
              key={messageGroups[index].id} 
              group={messageGroups[index]}
              onHeightChange={(height) => setItemSize(index, height)}
            />
          </div>
        )}
      </List>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;