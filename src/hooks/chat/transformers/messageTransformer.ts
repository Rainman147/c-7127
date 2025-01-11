import type { 
  Message, 
  MessageRole, 
  MessageStatus, 
  MessageType,
  DbMessage,
  TemplateContext,
  DbTemplateContext 
} from '@/types/message';
import { parseSupabaseJson } from '@/types/utils';

// Validate and convert database sender to frontend role
const validateMessageRole = (sender: string): MessageRole => {
  console.log('[validateMessageRole] Validating sender:', sender);
  if (sender !== 'user' && sender !== 'assistant') {
    console.warn(`[validateMessageRole] Invalid sender type: ${sender}, defaulting to 'user'`);
    return 'user';
  }
  return sender as MessageRole;
};

// Validate and convert database status to frontend status
const validateMessageStatus = (status: string | null): MessageStatus => {
  console.log('[validateMessageStatus] Validating status:', status);
  const validStatuses: MessageStatus[] = ['queued', 'sending', 'sent', 'error'];
  if (!status || !validStatuses.includes(status as MessageStatus)) {
    console.warn(`[validateMessageStatus] Invalid status: ${status}, defaulting to 'queued'`);
    return 'queued';
  }
  return status as MessageStatus;
};

// Extract metadata from database message
const extractMetadata = (dbMessage: DbMessage) => {
  console.log('[extractMetadata] Extracting metadata for message:', dbMessage.id);
  return {
    sequence: dbMessage.sequence,
    deliveredAt: dbMessage.delivered_at,
    seenAt: dbMessage.seen_at
  };
};

// Transform template context from DB to frontend format
export const transformTemplateContext = (dbContext: DbTemplateContext): TemplateContext => {
  console.log('[transformTemplateContext] Converting template context:', dbContext.id);
  return {
    id: dbContext.id,
    templateId: dbContext.template_id,
    chatId: dbContext.chat_id,
    messageId: dbContext.message_id,
    systemInstructions: dbContext.system_instructions,
    metadata: parseSupabaseJson(dbContext.metadata) || {},
    version: dbContext.version,
    createdAt: dbContext.created_at,
    updatedAt: dbContext.updated_at,
    userId: dbContext.user_id
  };
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
    metadata: extractMetadata(dbMessage)
  };
};

// Transform frontend message to database format
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

// Type guard for template context
export const isTemplateContext = (context: any): context is TemplateContext => {
  return (
    context &&
    typeof context.templateId === 'string' &&
    typeof context.systemInstructions === 'string'
  );
};