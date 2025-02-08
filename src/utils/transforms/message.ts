
import type { DbMessage } from '@/types/database';
import type { Message, MessageRole, MessageType } from '@/types/chat';

export const toFrontendMessage = (dbMessage: DbMessage): Message => ({
  id: dbMessage.id,
  chatId: dbMessage.chat_id,
  role: dbMessage.role as MessageRole, // Type assertion since we know the DB enforces valid roles
  content: dbMessage.content,
  type: dbMessage.type as MessageType, // Type assertion since we know the DB enforces valid types
  metadata: dbMessage.metadata as Record<string, any> || {},
  createdAt: dbMessage.created_at,
  status: dbMessage.status
});

export const toDatabaseMessage = (message: Partial<Message>): Partial<DbMessage> => ({
  chat_id: message.chatId,
  role: message.role,
  content: message.content,
  type: message.type,
  metadata: message.metadata as Json,
  status: message.status
});

