export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'audio';
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'error';

export interface MessageMetadata {
  sequence?: number;
  deliveredAt?: string;
  seenAt?: string;
}

export interface TemplateContext {
  templateId?: string;
  systemInstructions?: string;
}

export interface Message {
  id?: string;
  chatId: string;
  content: string;
  role: MessageRole;
  type: MessageType;
  status?: MessageStatus;
  createdAt?: string;
  isStreaming?: boolean;
  wasEdited?: boolean;
  metadata?: MessageMetadata;
  templateContext?: TemplateContext;
}

// Type for messages coming from the database
export interface DbMessage {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
  sequence?: number;
  status?: string;
  delivered_at?: string;
  seen_at?: string;
}

// Type guard to check if a message is from the database
export const isDbMessage = (message: any): message is DbMessage => {
  return (
    message &&
    typeof message.chat_id === 'string' &&
    typeof message.sender === 'string' &&
    typeof message.content === 'string'
  );
};

// Transformation function to convert DB message to frontend message
export const transformDbMessageToMessage = (dbMessage: DbMessage): Message => {
  console.log('[transformDbMessageToMessage] Converting message:', dbMessage.id);
  
  return {
    id: dbMessage.id,
    chatId: dbMessage.chat_id,
    content: dbMessage.content,
    role: dbMessage.sender as MessageRole,
    type: dbMessage.type as MessageType,
    status: dbMessage.status as MessageStatus,
    createdAt: dbMessage.created_at,
    metadata: {
      sequence: dbMessage.sequence,
      deliveredAt: dbMessage.delivered_at,
      seenAt: dbMessage.seen_at
    }
  };
};

// Transformation function to convert frontend message to DB format
export const transformMessageToDb = (message: Message): Partial<DbMessage> => {
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