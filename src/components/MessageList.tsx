import { useRef, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
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

  // Detect and handle duplicate messages
  useEffect(() => {
    const lastMessage = propMessages[propMessages.length - 1];
    if (lastMessage && lastMessage.id === lastMessageRef.current) {
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

  // Monitor connection state changes
  useEffect(() => {
    if (connectionState.status === 'disconnected' && connectionState.error) {
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

  // Log comprehensive render metrics
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