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
          duplicateCount: propMessages.filter(m => m.id === lastMessage.id).length
        }
      };

      const error = new Error('Duplicate message detected');
      ErrorTracker.trackError(error, metadata);

      logger.warn(LogCategory.STATE, 'MessageList', 'Duplicate message detected:', {
        messageId: lastMessage.id,
        timestamp: new Date().toISOString()
      });
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
          error: connectionState.error.message
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

  // Enhanced render metrics logging
  logger.debug(LogCategory.RENDER, 'MessageList', 'Render metrics', {
    duration: performance.now() - renderStartTime,
    messageCount: propMessages?.length ?? 0,
    groupCount: messageGroups?.length ?? 0,
    scrollMetrics,
    viewportHeight,
    keyboardVisible,
    connectionState: connectionState?.status || 'unknown',
    timestamp: new Date().toISOString()
  });

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
};

export default MessageList;