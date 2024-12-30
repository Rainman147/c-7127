import type { Message, MessageStatus } from './chat';

export interface MessageState {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  isProcessing: boolean;
  error: string | null;
}

export type MessageAction = 
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus } }
  | { type: 'UPDATE_MESSAGE_CONTENT'; payload: { messageId: string; content: string } }
  | { type: 'START_MESSAGE_EDIT'; payload: { messageId: string } }
  | { type: 'SAVE_MESSAGE_EDIT'; payload: { messageId: string; content: string } }
  | { type: 'CANCEL_MESSAGE_EDIT'; payload: { messageId: string } }
  | { type: 'CONFIRM_MESSAGE'; payload: { tempId: string; confirmedMessage: Message } }
  | { type: 'HANDLE_MESSAGE_FAILURE'; payload: { messageId: string; error: string } }
  | { type: 'RETRY_MESSAGE'; payload: { messageId: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_MESSAGES' };

export interface MessageContextType extends MessageState {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  sendMessage: (content: string, chatId: string, type: 'text' | 'audio', sequence: number) => Promise<any>;
  editMessage: (messageId: string, content: string, userId: string) => Promise<any>;
  retryMessage: (messageId: string) => Promise<void>;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  handleMessageEdit: (messageId: string) => void;
  handleMessageSave: (messageId: string, content: string) => Promise<void>;
  handleMessageCancel: (messageId: string) => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  handleMessageFailure: (messageId: string, error: string) => void;
  clearMessages: () => void;
  retryLoading: () => void;
}