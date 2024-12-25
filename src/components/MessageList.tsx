import { memo, useRef, useEffect, useMemo } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { ErrorMetadata } from '@/types/errorTracking';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { ConnectionStatus } from './message/ConnectionStatus';
import { MessageGroup } from './message/MessageGroup';
import { useScrollHandler } from './message/ScrollHandler';
import { useMessageGrouping } from '@/hooks/chat/useMessageGrouping';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

interface PerformanceMetrics {
  renderTime: number;
  messageCount: number;
  groupCount: number;
  averageRenderTime: number;
  timestamp: string;
}

// Extend Performance interface to include memory property
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const renderStartTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());
  const renderCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceMetricsInterval = useRef<NodeJS.Timeout>();
  
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  const { toast } = useToast();
  const lastMessageRef = useRef<string | null>(null);

  const { metrics: scrollMetrics } = useScrollHandler({
    messages: propMessages,
    viewportHeight,
    keyboardVisible,
    connectionState,
    containerRef
  });

  const messageGroups = useMessageGrouping(propMessages);

  // Memoized performance metrics calculation
  const calculatePerformanceMetrics = useMemo((): PerformanceMetrics => {
    return {
      renderTime: performance.now() - renderStartTime.current,
      messageCount: propMessages?.length ?? 0,
      groupCount: messageGroups?.length ?? 0,
      averageRenderTime: renderCount.current > 0 
        ? (performance.now() - renderStartTime.current) / renderCount.current 
        : 0,
      timestamp: new Date().toISOString()
    };
  }, [propMessages?.length, messageGroups?.length]);

  // Enhanced performance monitoring with cleanup
  useEffect(() => {
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    renderCount.current += 1;

    // Log performance metrics only when they exceed threshold or on significant changes
    if (timeSinceLastRender > 16.67 || renderCount.current % 10 === 0) {
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Performance metrics', {
        ...calculatePerformanceMetrics,
        timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`
      });
    }

    // Set up periodic memory usage monitoring with safe type checking
    performanceMetricsInterval.current = setInterval(() => {
      const extendedPerf = performance as ExtendedPerformance;
      if (extendedPerf.memory) {
        const memoryUsage = {
          usedJSHeapSize: extendedPerf.memory.usedJSHeapSize,
          totalJSHeapSize: extendedPerf.memory.totalJSHeapSize,
          timestamp: new Date().toISOString()
        };

        if (memoryUsage.usedJSHeapSize > 0.8 * memoryUsage.totalJSHeapSize) {
          logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'High memory usage detected', memoryUsage);
        }
      }
    }, 30000); // Check every 30 seconds

    lastRenderTime.current = currentTime;

    // Cleanup interval on unmount
    return () => {
      if (performanceMetricsInterval.current) {
        clearInterval(performanceMetricsInterval.current);
      }
    };
  }, [calculatePerformanceMetrics]);

  // Enhanced error tracking for duplicate messages
  useEffect(() => {
    const lastMessage = propMessages[propMessages.length - 1];
    if (lastMessage && lastMessage.id === lastMessageRef.current) {
      const metadata: ErrorMetadata = {
        component: 'MessageList',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        errorType: 'data',
        operation: 'message-deduplication',
        additionalInfo: {
          messageId: lastMessage.id,
          duplicateCount: propMessages.filter(m => m.id === lastMessage.id).length,
          renderCount: renderCount.current
        }
      };

      ErrorTracker.trackError(new Error('Duplicate message detected'), metadata);
      return;
    }
    
    if (lastMessage) {
      lastMessageRef.current = lastMessage.id;
    }
  }, [propMessages]);

  // Enhanced connection state monitoring
  useEffect(() => {
    if (connectionState.status === 'disconnected' && connectionState.error) {
      const metadata: ErrorMetadata = {
        component: 'MessageList',
        severity: 'high',
        timestamp: new Date().toISOString(),
        errorType: 'network',
        operation: 'connection-monitoring',
        additionalInfo: {
          connectionStatus: connectionState.status,
          retryCount: connectionState.retryCount,
          error: connectionState.error.message,
          renderCount: renderCount.current
        }
      };

      ErrorTracker.trackError(connectionState.error, metadata);
      toast({
        title: "Connection Lost",
        description: "Attempting to reconnect...",
        variant: "destructive",
      });
    } else if (connectionState.status === 'connected' && connectionState.retryCount > 0) {
      toast({
        title: "Connection Restored",
        description: "You're back online!",
        variant: "default",
      });
    }
  }, [connectionState.status, connectionState.error, connectionState.retryCount, toast]);

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
      className="flex-1 overflow-y-auto chat-scrollbar space-y-6 pb-[180px] pt-4 px-4"
    >
      <ConnectionStatus />
      {messageGroups.map((group) => (
        <MessageGroup key={group.id} group={group} />
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
