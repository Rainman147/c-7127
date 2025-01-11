import type { Message, MessageRole, MessageStatus, MessageType } from '@/types/message';
import type { DbMessage } from '@/types/message';

// Validate and convert database sender to frontend role
const validateMessageRole = (sender: string): MessageRole => {
  if (sender !== 'user' && sender !== 'assistant') {
    console.warn(`[validateMessageRole] Invalid sender type: ${sender}, defaulting to 'user'`);
    return 'user';
  }
  return sender as MessageRole;
};

// Validate and convert database status to frontend status
const validateMessageStatus = (status: string | null): MessageStatus => {
  const validStatuses: MessageStatus[] = ['queued', 'sending', 'sent', 'error'];
  if (!status || !validStatuses.includes(status as MessageStatus)) {
    console.warn(`[validateMessageStatus] Invalid status: ${status}, defaulting to 'queued'`);
    return 'queued';
  }
  return status as MessageStatus;
};

// Extract template context from message metadata if available
const extractTemplateContext = (dbMessage: DbMessage) => {
  console.log('[extractTemplateContext] Checking for template context in message:', dbMessage.id);
  
  if (!dbMessage.template_context) {
    return undefined;
  }

  try {
    const context = typeof dbMessage.template_context === 'string' 
      ? JSON.parse(dbMessage.template_context)
      : dbMessage.template_context;

    return {
      templateId: context.templateId,
      systemInstructions: context.systemInstructions
    };
  } catch (error) {
    console.warn('[extractTemplateContext] Error parsing template context:', error);
    return undefined;
  }
};

// Extract metadata from database message
const extractMetadata = (dbMessage: DbMessage) => {
  const metadata = {
    sequence: dbMessage.sequence,
    deliveredAt: dbMessage.delivered_at,
    seenAt: dbMessage.seen_at
  };

  // Add patientId if available from the chat context
  // This would need to be implemented when chat context is available
  return metadata;
};

// Transform database message to frontend message
export const transformDbMessageToMessage = (dbMessage: DbMessage): Message => {
  console.log('[transformDbMessageToMessage] Converting message:', dbMessage.id);
  
  return {
    id: dbMessage.id,
    chatId: dbMessage.chat_id,
    content: dbMessage.content,
    role: validateMessageRole(dbMessage.sender),
    type: (dbMessage.type || 'text') as MessageType,
    status: validateMessageStatus(dbMessage.status),
    createdAt: dbMessage.created_at,
    metadata: extractMetadata(dbMessage),
    templateContext: extractTemplateContext(dbMessage)
  };
};

// Transform frontend message to database format with required fields
export const transformMessageToDb = (message: Message): Pick<DbMessage, 'chat_id' | 'content' | 'sender'> & Partial<Omit<DbMessage, 'chat_id' | 'content' | 'sender'>> => {
  console.log('[transformMessageToDb] Converting message for chat:', message.chatId);
  
  if (!message.chatId || !message.content || !message.role) {
    console.error('[transformMessageToDb] Missing required message fields:', message);
    throw new Error('Missing required message fields for database transformation');
  }

  const dbMessage = {
    chat_id: message.chatId,
    content: message.content,
    sender: message.role,
    type: message.type,
    status: message.status,
    sequence: message.metadata?.sequence,
    delivered_at: message.metadata?.deliveredAt,
    seen_at: message.metadata?.seenAt
  };

  // Add template context if available
  if (message.templateContext) {
    console.log('[transformMessageToDb] Adding template context');
    dbMessage.template_context = JSON.stringify(message.templateContext);
  }

  return dbMessage;
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