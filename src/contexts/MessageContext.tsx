import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    failedCount: state.failedMessages.length,
    stateSnapshot: {
      messages: state.messages.map(m => ({
        id: m.id,
        status: m.status,
        sequence: m.sequence
      }))
    }
  });

  const setMessages = useCallback((messages: Message[]) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Setting messages:', {
      count: messages.length,
      messageIds: messages.map(m => m.id)
    });
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const addMessage = useCallback((message: Message) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Adding message:', {
      id: message.id,
      status: message.status,
      isOptimistic: message.isOptimistic
    });
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Updating message status:', {
      messageId,
      status
    });
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, []);

  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Confirming message:', {
      tempId,
      confirmedId: confirmedMessage.id
    });
    dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
  }, []);

  const handleMessageFailure = useCallback((messageId: string, error: string) => {
    logger.error(LogCategory.ERROR, 'MessageContext', 'Message failure:', {
      messageId,
      error
    });
    dispatch({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
  }, []);

  const clearMessages = useCallback(() => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Clearing all messages');
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const value = {
    ...state,
    setMessages,
    addMessage,
    updateMessageStatus,
    confirmMessage,
    handleMessageFailure,
    clearMessages
  };

  return (
    <MessageContext.Provider value={value}>
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