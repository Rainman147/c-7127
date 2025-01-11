import type { Message, DbMessage } from '@/types/message';
import { validateMessageRole, validateMessageStatus, validateMessageType } from './baseTransformer';
import { transformTemplateContext } from './templateContextTransformer';
import { extractMetadata } from './metadataTransformer';

// Transform database message to frontend message
export const transformDbMessageToMessage = (dbMessage: DbMessage): Message => {
  console.log('[transformDbMessageToMessage] Converting message:', dbMessage.id);
  
  const message: Message = {
    id: dbMessage.id,
    chatId: dbMessage.chat_id,
    content: dbMessage.content,
    role: validateMessageRole(dbMessage.sender),
    type: validateMessageType(dbMessage.type),
    status: validateMessageStatus(dbMessage.status),
    createdAt: dbMessage.created_at,
    metadata: extractMetadata(dbMessage)
  };

  // Add template context if available
  if (dbMessage.template_contexts?.[0]) {
    message.templateContext = transformTemplateContext(dbMessage.template_contexts[0]);
  }

  return message;
};

// Transform frontend message to database format
export const transformMessageToDb = (message: Message): Omit<DbMessage, 'id' | 'created_at'> => {
  console.log('[transformMessageToDb] Converting message for chat:', message.chatId);
  
  if (!message.chatId || !message.content || !message.role) {
    console.error('[transformMessageToDb] Missing required message fields:', message);
    throw new Error('Missing required message fields for database transformation');
  }

  return {
    chat_id: message.chatId,
    content: message.content,
    sender: message.role,
    type: message.type || 'text',
    status: message.status,
    sequence: message.metadata?.sequence,
    delivered_at: message.metadata?.deliveredAt,
    seen_at: message.metadata?.seenAt
  };
};

// Type guard to check if a message is from the database
export const isDbMessage = (message: any): message is DbMessage => {
  return (
    message &&
    typeof message.chat_id === 'string' &&
    typeof message.sender === 'string' &&
    typeof message.content === 'string'
  );
};