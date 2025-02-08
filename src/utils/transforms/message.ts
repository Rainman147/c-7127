
import type { DbMessage } from '@/types/database';
import type { Message, MessageRole, MessageType } from '@/types/chat';
import { Json } from '@/integrations/supabase/types';

export const toFrontendMessage = (dbMessage: DbMessage): Message => ({
  id: dbMessage.id,
  chatId: dbMessage.chat_id,
  role: dbMessage.role as MessageRole,
  content: dbMessage.content,
  type: dbMessage.type as MessageType,
  metadata: dbMessage.metadata as Record<string, any> || {},
  createdAt: dbMessage.created_at,
  status: dbMessage.status as 'delivered' | 'pending' | 'error'
});

export const toDatabaseMessage = (message: Partial<Message>): Partial<DbMessage> => ({
  chat_id: message.chatId,
  role: message.role,
  content: message.content,
  type: message.type,
  metadata: message.metadata as Json,
  status: message.status
});
