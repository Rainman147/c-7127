import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { messageReducer, initialState } from '@/reducers/messageReducer';
import type { MessageContextType, MessageState } from '@/types/messageContext';
import type { Message, MessageStatus } from '@/types/chat';

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);

  logger.debug(LogCategory.STATE, 'MessageContext', 'Provider state update:', {
    messageCount: state.messages.length,
    pendingCount: state.pendingMessages.length,
    confirmedCount: state.confirmedMessages.length,
    failedCount: state.failedMessages.length
  });

  const setMessages = useCallback((messages: Message[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, []);

  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
  }, []);

  const handleMessageFailure = useCallback((messageId: string, error: string) => {
    dispatch({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  return (
    <MessageContext.Provider
      value={{
        ...state,
        setMessages,
        addMessage,
        updateMessageStatus,
        confirmMessage,
        handleMessageFailure,
        clearMessages
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};