import { useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { ErrorMetadata } from '@/types/errorTracking';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useRealTime } from '@/contexts/RealTimeContext';
import { ConnectionStatus } from './message/ConnectionStatus';
import { MessageGroup } from './message/MessageGroup';
import { useScrollHandler } from './message/ScrollHandler';
import { useMessageGrouping } from '@/hooks/chat/useMessageGrouping';
import { useMessageQuery } from '@/hooks/chat/useMessageQuery';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

const MessageList = ({ messages: propMessages }: { messages: Message[] }) => {
  const renderStartTime = performance.now();
  const lastRenderTime = useRef(performance.now());
  const renderCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Enhanced performance monitoring
  useEffect(() => {
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    renderCount.current += 1;

    logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Render performance metrics', {
      renderCount: renderCount.current,
      timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
      messageCount: propMessages?.length ?? 0,
      groupCount: messageGroups?.length ?? 0,
      averageRenderTime: `${(currentTime - renderStartTime) / renderCount.current}ms`,
      timestamp: new Date().toISOString()
    });

    // Log warning for potentially problematic render times
    if (timeSinceLastRender > 16.67) { // More than 60fps threshold
      logger.warn(LogCategory.PERFORMANCE, 'MessageList', 'Render time exceeded frame budget', {
        renderTime: timeSinceLastRender,
        messageCount: propMessages?.length,
        groupCount: messageGroups?.length
      });
    }

    lastRenderTime.current = currentTime;

    // Memory usage monitoring
    if (performance?.memory) {
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'Memory usage', {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        timestamp: new Date().toISOString()
      });
    }
  });

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
      logger.info(LogCategory.COMMUNICATION, 'MessageList', 'Connection restored', {
        retryCount: connectionState.retryCount,
        timestamp: new Date().toISOString()
      });

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