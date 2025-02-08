
import type { Message, ChatSession, MessageMetadata } from './types';

/**
 * Type guard to validate a message object
 */
export const isValidMessage = (message: unknown): message is Message => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Partial<Message>;
  
  return (
    typeof msg.chatId === 'string' &&
    typeof msg.role === 'string' &&
    ['user', 'assistant', 'system'].includes(msg.role) &&
    typeof msg.content === 'string'
  );
};

/**
 * Type guard to validate message metadata
 */
export const isValidMessageMetadata = (metadata: unknown): metadata is MessageMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  const meta = metadata as Partial<MessageMetadata>;

  return (
    (meta.isFirstMessage === undefined || typeof meta.isFirstMessage === 'boolean') &&
    (meta.transcriptionId === undefined || typeof meta.transcriptionId === 'string') &&
    (meta.processingDuration === undefined || typeof meta.processingDuration === 'number') &&
    (meta.editedAt === undefined || typeof meta.editedAt === 'string') &&
    (meta.originalContent === undefined || typeof meta.originalContent === 'string')
  );
};

/**
 * Type guard to validate a chat session
 */
export const isValidChatSession = (chat: unknown): chat is ChatSession => {
  if (!chat || typeof chat !== 'object') {
    return false;
  }

  const session = chat as Partial<ChatSession>;

  return (
    Array.isArray(session.messages) &&
    typeof session.title === 'string' &&
    typeof session.userId === 'string' &&
    (session.templateId === undefined || typeof session.templateId === 'string') &&
    (session.patientId === undefined || typeof session.patientId === 'string')
  );
};
