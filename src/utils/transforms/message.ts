
import type { DbMessage } from '@/types/database';
import type { Message } from '@/types/chat';

export const toFrontendMessage = (dbMessage: DbMessage): Message => ({
  id: dbMessage.id,
  chatId: dbMessage.chat_id,
  role: dbMessage.role,
  content: dbMessage.content,
  type: dbMessage.type,
  metadata: dbMessage.metadata,
  createdAt: dbMessage.created_at
});

export const toDatabaseMessage = (message: Partial<Message>): Partial<DbMessage> => ({
  chat_id: message.chatId,
  role: message.role,
  content: message.content,
  type: message.type,
  metadata: message.metadata
});
