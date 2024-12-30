import type { Message, MessageStatus } from './chat';

export interface MessageState {
  messages: Message[];
  pendingMessages: Message[];
  isProcessing: boolean;
  error: string | null;
  editingMessageId: string | null;
}

export type MessageAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus } }
  | { type: 'UPDATE_MESSAGE_CONTENT'; payload: { messageId: string; content: string } }
  | { type: 'CONFIRM_MESSAGE'; payload: { tempId: string; confirmedMessage: Message } }
  | { type: 'HANDLE_MESSAGE_FAILURE'; payload: { messageId: string; error: string } }
  | { type: 'RETRY_MESSAGE'; payload: { messageId: string } }
  | { type: 'START_MESSAGE_EDIT'; payload: { messageId: string } }
  | { type: 'SAVE_MESSAGE_EDIT'; payload: { messageId: string; content: string } }
  | { type: 'CANCEL_MESSAGE_EDIT'; payload: { messageId: string } }
  | { type: 'CLEAR_ERROR'; payload: null }
  | { type: 'CLEAR_MESSAGES'; payload: null };

export interface MessageContextType extends MessageState {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  handleMessageEdit: (messageId: string) => void;
  handleMessageSave: (messageId: string, content: string) => void;
  handleMessageCancel: (messageId: string) => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  handleMessageFailure: (messageId: string, error: string) => void;
  retryMessage: (messageId: string) => void;
  clearMessages: () => void;
  retryLoading: () => void;
}