import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageTransform = () => {
  const transformDatabaseMessages = (messages: DatabaseMessage[]): Message[] => {
    const startTime = performance.now();
    console.log('[useMessageTransform] Starting batch transformation:', {
      count: messages.length,
      sequences: messages.map(m => m.sequence),
      timestamp: new Date().toISOString()
    });

    const transformed = messages.map((msg, index) => {
      console.log('[useMessageTransform] Transforming message:', {
        messageId: msg.id,
        sequence: msg.sequence || index + 1,
        type: msg.type
      });
      
      return {
        role: msg.sender as 'user' | 'assistant',
        content: msg.content,
        type: msg.type as 'text' | 'audio',
        id: msg.id,
        sequence: msg.sequence || index + 1,
        created_at: msg.created_at
      };
    });

    const duration = performance.now() - startTime;
    console.log('[useMessageTransform] Batch transformation complete:', {
      inputCount: messages.length,
      outputCount: transformed.length,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    return transformed;
  };

  const transformDatabaseMessage = (msg: DatabaseMessage): Message => {
    const startTime = performance.now();
    console.log('[useMessageTransform] Transforming single message:', {
      id: msg.id,
      sequence: msg.sequence,
      timestamp: new Date().toISOString()
    });

    const transformed = {
      role: msg.sender as 'user' | 'assistant',
      content: msg.content,
      type: msg.type as 'text' | 'audio',
      id: msg.id,
      sequence: msg.sequence,
      created_at: msg.created_at
    };

    const duration = performance.now() - startTime;
    console.log('[useMessageTransform] Single transformation complete:', {
      messageId: msg.id,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    return transformed;
  };

  return {
    transformDatabaseMessages,
    transformDatabaseMessage
  };
};