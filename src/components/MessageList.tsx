import { memo, useRef } from 'react';
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

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string | null>(null);
  
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const { connectionState } = useRealTime();
  const { toast } = useToast();

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

  // Enhanced error tracking for duplicate messages
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

    ErrorTracker.trackError(new Error('Duplicate message detected'), metadata);
  } else if (lastMessage) {
    lastMessageRef.current = lastMessage.id;
  }

  // Enhanced connection state monitoring
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
    toast({
      title: "Connection Restored",
      description: "You're back online!",
      variant: "default",
    });
  }

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