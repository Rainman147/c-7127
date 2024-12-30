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
  | { type: 'CANCEL_MESSAGE_EDIT'; payload: { messageId: string } };