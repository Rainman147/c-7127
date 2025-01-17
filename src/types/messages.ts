/**
 * Enum for message types that matches our database ENUM
 */
export type MessageType = 'text' | 'audio';

/**
 * Base message interface using the new MessageType
 */
export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: MessageType;
  isStreaming?: boolean;
}

/**
 * Message with required chat context
 */
export interface ChatMessage extends Message {
  chat_id: string;
  created_at?: string;
  status?: 'queued' | 'sending' | 'delivered' | 'failed';
  delivered_at?: string;
  seen_at?: string;
}

/**
 * Type guard to check if a message is a ChatMessage
 */
export function isChatMessage(message: Message): message is ChatMessage {
  return 'chat_id' in message;
}

/**
 * Type guard to check if a string is a valid MessageType
 */
export function isValidMessageType(type: string): type is MessageType {
  return ['text', 'audio'].includes(type);
}