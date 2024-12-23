import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageTransform = () => {
  const transformDatabaseMessages = (messages: DatabaseMessage[]): Message[] => {
    console.log('[useMessageTransform] Starting messages transformation:', {
      count: messages.length,
      sequences: messages.map(m => m.sequence)
    });

    const transformed = messages.map(msg => ({
      role: msg.sender as 'user' | 'assistant',
      content: msg.content,
      type: msg.type as 'text' | 'audio',
      id: msg.id,
      sequence: msg.sequence || messages.indexOf(msg) + 1,
      created_at: msg.created_at
    }));

    console.log('[useMessageTransform] Messages transformed:', {
      inputCount: messages.length,
      outputCount: transformed.length,
      sequences: transformed.map(m => m.sequence)
    });

    return transformed;
  };

  const transformDatabaseMessage = (msg: DatabaseMessage): Message => {
    console.log('[useMessageTransform] Transforming single message:', {
      id: msg.id,
      sequence: msg.sequence
    });

    return {
      role: msg.sender as 'user' | 'assistant',
      content: msg.content,
      type: msg.type as 'text' | 'audio',
      id: msg.id,
      sequence: msg.sequence,
      created_at: msg.created_at
    };
  };

  return {
    transformDatabaseMessages,
    transformDatabaseMessage
  };
};