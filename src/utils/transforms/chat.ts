
import type { DbMessage, DbChat } from '@/types/database';
import type { Message, ChatSession, MessageMetadata } from '@/types/chat/types';
import { Json } from '@/integrations/supabase/types';

/**
 * Converts a database message to a frontend message
 */
export const toFrontendMessage = (dbMessage: DbMessage): Message => ({
  id: dbMessage.id,
  chatId: dbMessage.chat_id,
  role: dbMessage.role as Message['role'],
  content: dbMessage.content,
  type: dbMessage.type as Message['type'],
  metadata: dbMessage.metadata as MessageMetadata || {},
  createdAt: dbMessage.created_at,
  status: dbMessage.status as Message['status']
});

/**
 * Converts a frontend message to a database message
 */
export const toDatabaseMessage = (message: Partial<Message>): Partial<DbMessage> => ({
  chat_id: message.chatId,
  role: message.role,
  content: message.content,
  type: message.type,
  metadata: message.metadata as Json,
  status: message.status
});

/**
 * Converts a database chat to a frontend chat session
 */
export const toFrontendChatSession = (dbChat: DbChat & { messages?: DbMessage[] }): ChatSession => ({
  id: dbChat.id,
  title: dbChat.title,
  templateId: dbChat.template_id,
  patientId: dbChat.patient_id,
  userId: dbChat.user_id,
  createdAt: dbChat.created_at,
  updatedAt: dbChat.updated_at,
  messages: dbChat.messages?.map(toFrontendMessage) || []
});

/**
 * Converts a frontend chat session to a database chat
 */
export const toDatabaseChat = (chat: Partial<ChatSession>): Partial<DbChat> => ({
  title: chat.title,
  template_id: chat.templateId,
  patient_id: chat.patientId,
  user_id: chat.userId
});
