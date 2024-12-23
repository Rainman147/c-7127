import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';

export const useMessageTransform = () => {
  const transformDatabaseMessages = (messages: DatabaseMessage[]): Message[] => {
    console.log('[useMessageTransform] Transforming messages:', {
      count: messages.length,
      sequences: messages.map(m => m.sequence)
    });

    return messages.map(msg => ({
      role: msg.sender as 'user' | 'assistant',
      content: msg.content,
      type: msg.type as 'text' | 'audio',
      id: msg.id,
      sequence: msg.sequence || messages.indexOf(msg) + 1,
      created_at: msg.created_at
    }));
  };

  const transformDatabaseMessage = (msg: DatabaseMessage): Message => ({
    role: msg.sender as 'user' | 'assistant',
    content: msg.content,
    type: msg.type as 'text' | 'audio',
    id: msg.id,
    sequence: msg.sequence,
    created_at: msg.created_at
  });

  return {
    transformDatabaseMessages,
    transformDatabaseMessage
  };
};