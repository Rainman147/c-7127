import { createContext, useContext, useReducer, Dispatch } from 'react';
import { messageReducer } from './message/messageReducer';
import type { Message, MessageStatus } from '@/types/chat';
import type { MessageContextType, MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

const MessageContext = createContext<MessageContextType | null>(null);

const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  confirmedMessages: [],
  failedMessages: [],
  isProcessing: false,
  editingMessageId: null,
  error: null,
};

export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer<(state: MessageState, action: MessageAction) => MessageState>(
    messageReducer,
    initialState
  );

  const setMessages = (messages: Message[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  };

  const addMessage = (message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const updateMessageStatus = (messageId: string, status: MessageStatus) => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  };

  const updateMessageContent = (messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
  };

  const handleMessageEdit = (messageId: string) => {
    dispatch({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
  };

  const handleMessageSave = (messageId: string, content: string) => {
    dispatch({ type: 'SAVE_MESSAGE_EDIT', payload: { messageId, content } });
  };

  const handleMessageCancel = (messageId: string) => {
    dispatch({ type: 'CANCEL_MESSAGE_EDIT', payload: { messageId } });
  };

  const retryMessage = (messageId: string) => {
    dispatch({ type: 'RETRY_MESSAGE', payload: { messageId } });
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const retryLoading = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const confirmMessage = (tempId: string, confirmedMessage: Message) => {
    dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
  };

  const handleMessageFailure = (messageId: string, error: string) => {
    dispatch({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
  };

  const value: MessageContextType = {
    ...state,
    setMessages,
    addMessage,
    updateMessageStatus,
    updateMessageContent,
    handleMessageEdit,
    handleMessageSave,
    handleMessageCancel,
    retryMessage,
    clearMessages,
    retryLoading,
    confirmMessage,
    handleMessageFailure,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};