import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageTransform = () => {
  const transformMessage = (message: any): Message => {
    logger.debug(LogCategory.STATE, 'useMessageTransform', 'Transforming message:', {
      messageId: message.id
    });

    return {
      id: message.id,
      content: message.content,
      role: message.sender as 'user' | 'assistant',
      type: message.type as 'text' | 'audio',
      sequence: message.sequence,
      created_at: message.created_at,
      chat_id: message.chat_id
    };
  };

  return {
    transformMessage
  };
};