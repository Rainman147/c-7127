import type { Message, MessageStatus } from './chat';

export interface MessageState {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  isProcessing: boolean;
}

export interface MessageContextType extends MessageState {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  handleMessageFailure: (messageId: string, error: string) => void;
  clearMessages: () => void;
}

export type MessageAction = 
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus } }
  | { type: 'CONFIRM_MESSAGE'; payload: { tempId: string; confirmedMessage: Message } }
  | { type: 'HANDLE_MESSAGE_FAILURE'; payload: { messageId: string; error: string } }
  | { type: 'CLEAR_MESSAGES' };