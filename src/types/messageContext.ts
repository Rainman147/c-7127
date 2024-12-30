import type { Message, MessageStatus } from './chat';

export interface MessageState {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  isProcessing: boolean;
  editingMessageId: string | null;
  error: string | null;
}

export interface MessageContextType extends MessageState {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  handleMessageEdit: (messageId: string) => void;
  handleMessageSave: (messageId: string, content: string) => void;
  handleMessageCancel: (messageId: string) => void;
  retryMessage: (messageId: string) => void;
  clearMessages: () => void;
  retryLoading: () => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  handleMessageFailure: (messageId: string, error: string) => void;
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