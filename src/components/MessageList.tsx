import { useEffect, useState } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { groupMessages } from '@/utils/messageGrouping';
import { useViewportMonitor } from '@/hooks/useViewportMonitor';
import { useScrollManager } from './message/ScrollManager';
import { useMessageListMetrics } from './message/useMessageListMetrics';
import MessageListContainer from './message/MessageListContainer';
import MessageGroups from './message/MessageGroups';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading = false }: MessageListProps) => {
  const { viewportHeight, keyboardVisible } = useViewportMonitor();
  const [isMounted, setIsMounted] = useState(false);
  const { metrics } = useMessageListMetrics(null, isMounted, keyboardVisible);
  
  // Track mount status with performance timing
  useEffect(() => {
    const mountPerformance = metrics.measureOperation('Component mounting');
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Component mounting started', {
      timestamp: new Date().toISOString()
    });

    setIsMounted(true);

    return () => {
      const unmountDuration = mountPerformance.end();
      logger.debug(LogCategory.STATE, 'MessageList', 'Component unmounted', {
        unmountDuration,
        timestamp: new Date().toISOString()
      });
      setIsMounted(false);
    };
  }, [metrics]);

  // Message grouping with performance tracking
  const messageGroups = (() => {
    const groupStartTime = performance.now();
    const groups = groupMessages(messages);
    
    logger.debug(LogCategory.STATE, 'MessageList', 'Message grouping complete', {
      duration: performance.now() - groupStartTime,
      messageCount: messages.length,
      groupCount: groups.length,
      timestamp: new Date().toISOString()
    });
    
    return groups;
  })();

  if (messages.length === 0) {
    return (
      <div className="text-center text-white/70 mt-8">
        No messages yet. Start a conversation!
      </div>
    );
  }

  return (
    <MessageListContainer 
      isMounted={isMounted}
      keyboardVisible={keyboardVisible}
    >
      <MessageGroups groups={messageGroups} />
    </MessageListContainer>
  );
};

export default MessageList;