import type { Message } from '@/types/message';
import type { DbMessage } from '@/types/message';

export const transformDbMessageToMessage = (dbMessage: DbMessage): Message => {
  console.log('[transformDbMessageToMessage] Converting message:', dbMessage.id);
  
  return {
    id: dbMessage.id,
    chatId: dbMessage.chat_id,
    content: dbMessage.content,
    role: dbMessage.sender as Message['role'],
    type: dbMessage.type as Message['type'],
    status: dbMessage.status as Message['status'],
    createdAt: dbMessage.created_at,
    metadata: {
      sequence: dbMessage.sequence,
      deliveredAt: dbMessage.delivered_at,
      seenAt: dbMessage.seen_at
    }
  };
};

export const transformMessageToDb = (message: Partial<Message>): Partial<DbMessage> => {
  console.log('[transformMessageToDb] Converting message for chat:', message.chatId);
  
  return {
    chat_id: message.chatId,
    content: message.content,
    sender: message.role,
    type: message.type,
    status: message.status,
    sequence: message.metadata?.sequence,
    delivered_at: message.metadata?.deliveredAt,
    seen_at: message.metadata?.seenAt
  };
};