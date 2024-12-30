import type { Message, MessageStatus } from './chat';

export interface MessageContextType {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  isProcessing: boolean;
  error: string | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  handleMessageEdit: (messageId: string) => void;
  handleMessageSave: (messageId: string, content: string) => void;
  handleMessageCancel: (messageId: string) => void;
  retryMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  retryLoading: () => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  handleMessageFailure: (messageId: string, error: string) => void;
}