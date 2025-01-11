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
    metadata: {
      sequence: dbMessage.sequence,
      deliveredAt: dbMessage.delivered_at,
      seenAt: dbMessage.seen_at
    }
  };
};

// Transform frontend message to database format
export const transformMessageToDb = (message: Message): Required<Pick<DbMessage, 'chat_id' | 'content' | 'sender' | 'type'>> & Partial<DbMessage> => {
  console.log('[transformMessageToDb] Converting message for chat:', message.chatId);
  
  if (!message.chatId || !message.content || !message.role || !message.type) {
    console.error('[transformMessageToDb] Missing required message fields:', { message });
    throw new Error('Missing required message fields');
  }
  
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

// Type guard to check if a message is from the database
export const isDbMessage = (message: any): message is DbMessage => {
  return (
    message &&
    typeof message.chat_id === 'string' &&
    typeof message.sender === 'string' &&
    typeof message.content === 'string'
  );
};