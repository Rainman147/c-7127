import { MessageLoadingState } from './message/MessageLoadingState';
import { MessageEmptyState } from './message/MessageEmptyState';
import MessageListContainer from './message/MessageListContainer';
import { useMessageState } from '@/hooks/chat/useMessageState';
import { logger, LogCategory } from '@/utils/logging';

const MessageList = ({ isLoading }: { isLoading?: boolean }) => {
  const { messages } = useMessageState();

  // Enhanced logging for component mount/unmount lifecycle
  logger.debug(LogCategory.LIFECYCLE, 'MessageList', 'Component lifecycle event:', {
    event: 'render',
    timestamp: new Date().toISOString(),
    componentState: {
      isLoading,
      hasMessages: messages?.length > 0,
      messageCount: messages?.length || 0
    }
  });

  // Enhanced logging for message loading and state transitions
  logger.debug(LogCategory.STATE, 'MessageList', 'Rendering with state:', {
    isLoading,
    messageCount: messages?.length || 0,
    messageIds: messages?.map(m => m.id) || [],
    hasMessages: messages?.length > 0,
    messageDetails: messages?.map(m => ({
      id: m.id,
      role: m.role,
      type: m.type,
      sequence: m.sequence,
      isOptimistic: m.isOptimistic,
      contentPreview: m.content?.substring(0, 50),
      created_at: m.created_at,
      status: m.status,
      timestamp: new Date().toISOString(),
      loadTime: Date.now(),
      stateTransition: isLoading ? 'loading' : messages?.length === 0 ? 'empty' : 'loaded'
    })),
    sessionInfo: {
      totalMessages: messages?.length || 0,
      oldestMessage: messages?.[0]?.created_at,
      newestMessage: messages?.[messages?.length - 1]?.created_at,
      loadTimestamp: new Date().toISOString(),
      messageGaps: messages?.reduce((gaps, m, i) => {
        if (i > 0 && m.sequence - messages[i-1].sequence > 1) {
          gaps.push({
            beforeId: messages[i-1].id,
            afterId: m.id,
            gap: m.sequence - messages[i-1].sequence
          });
        }
        return gaps;
      }, [] as any[]) || []
    },
    renderContext: {
      componentStack: new Error().stack,
      renderTime: performance.now(),
      memoryUsage: window.performance?.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize
      } : 'Not available'
    }
  });

  if (isLoading) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing loading state', {
      timestamp: new Date().toISOString(),
      currentMessageCount: messages?.length || 0,
      transitionType: 'loading->empty',
      renderContext: {
        componentStack: new Error().stack,
        renderTime: performance.now()
      }
    });
    return <MessageLoadingState />;
  }

  if (!messages || messages.length === 0) {
    logger.info(LogCategory.STATE, 'MessageList', 'Showing empty state', {
      messages: messages,
      isArray: Array.isArray(messages),
      isLoading,
      timestamp: new Date().toISOString(),
      context: 'Empty messages array detected',
      transitionType: 'loaded->empty',
      renderContext: {
        componentStack: new Error().stack,
        renderTime: performance.now()
      }
    });
    return <MessageEmptyState />;
  }

  logger.debug(LogCategory.RENDER, 'MessageList', 'Rendering message container', {
    messageCount: messages.length,
    firstMessage: messages[0] ? {
      id: messages[0].id,
      role: messages[0].role,
      contentPreview: messages[0].content?.substring(0, 50),
      sequence: messages[0].sequence,
      status: messages[0].status,
      created_at: messages[0].created_at,
      loadTime: Date.now()
    } : null,
    lastMessage: messages.length > 0 ? {
      id: messages[messages.length - 1].id,
      role: messages[messages.length - 1].role,
      contentPreview: messages[messages.length - 1].content?.substring(0, 50),
      sequence: messages[messages.length - 1].sequence,
      status: messages[messages.length - 1].status,
      created_at: messages[messages.length - 1].created_at,
      loadTime: Date.now()
    } : null,
    timestamp: new Date().toISOString(),
    renderContext: {
      totalMessages: messages.length,
      messageOrder: messages.map(m => ({
        id: m.id, 
        sequence: m.sequence,
        timeDiff: m.created_at ? new Date(m.created_at).getTime() - Date.now() : null
      })),
      renderTime: performance.now(),
      transitionType: 'loaded->rendered',
      componentStack: new Error().stack
    }
  });
  
  return <MessageListContainer />;
};

export default MessageList;