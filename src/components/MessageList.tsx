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

const MessageList = memo(({ messages: propMessages }: { messages: Message[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const lastMessageRef = useRef<string | null>(null);
  const sizeMap = useRef<{ [key: string]: number }>({});
  
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

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setListHeight(height);
      logger.debug(LogCategory.PERFORMANCE, 'MessageList', 'List height updated', {
        height,
        viewportHeight,
        keyboardVisible
      });
    }
  }, [viewportHeight, keyboardVisible]);

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

  const getItemSize = (index: number) => {
    const groupId = messageGroups[index]?.id;
    if (!groupId) return 100; // Default height
    return sizeMap.current[groupId] || 100;
  };

  const setItemSize = (index: number, size: number) => {
    const groupId = messageGroups[index]?.id;
    if (groupId && sizeMap.current[groupId] !== size) {
      sizeMap.current[groupId] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
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