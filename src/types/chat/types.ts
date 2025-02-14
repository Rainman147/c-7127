
/**
 * Represents the role of a message in a chat conversation
 * @readonly
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Represents the type of content in a message
 * @readonly
 */
export type MessageType = 'text' | 'audio' | 'image';

/**
 * Metadata associated with a message
 */
export interface MessageMetadata {
  isFirstMessage?: boolean;
  transcriptionId?: string;
  processingDuration?: number;
  editedAt?: string;
  originalContent?: string;
  tempId?: string;
  isOptimistic?: boolean;
  retryCount?: number;
  sortIndex?: number;
}

/**
 * Represents a single message in a chat conversation
 */
export interface Message {
  id?: string;
  chatId: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  metadata?: MessageMetadata;
  createdAt: string;  // Made required
  status?: 'delivered' | 'pending' | 'error';
}

/**
 * Represents a chat session between a user and the assistant
 */
export interface ChatSession {
  id?: string;
  messages: Message[];
  templateId?: string;
  patientId?: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}

/**
 * Context information for a chat session
 */
export interface ChatContext {
  sessionId: string;
  templateId?: string;
  patientId?: string;
  messages: Message[];
}

/**
 * Error types specific to chat operations
 */
export interface ChatError extends Error {
  code: string;
  details?: Record<string, unknown>;
}
