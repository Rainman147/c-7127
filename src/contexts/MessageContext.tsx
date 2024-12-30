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

  logger.debug(LogCategory.STATE, 'MessageContext', 'Current state:', {
    messageCount: state.messages.length,
    pendingCount: state.pendingMessages.length,
    confirmedCount: state.confirmedMessages.length,
    failedCount: state.failedMessages.length,
    isProcessing: state.isProcessing,
    editingMessageId: state.editingMessageId,
    error: state.error,
    stateSnapshot: JSON.stringify(state),
    timestamp: new Date().toISOString()
  });

  const setMessages = (messages: Message[]) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Setting messages:', {
      messageCount: messages.length,
      messageIds: messages.map(m => m.id),
      operation: 'setMessages',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  };

  const addMessage = (message: Message) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Adding message:', {
      messageId: message.id,
      isOptimistic: message.isOptimistic,
      operation: 'addMessage',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const updateMessageStatus = (messageId: string, status: MessageStatus) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Updating message status:', {
      messageId,
      status,
      operation: 'updateMessageStatus',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  };

  const updateMessageContent = (messageId: string, content: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Updating message content:', {
      messageId,
      contentLength: content.length,
      operation: 'updateMessageContent',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
  };

  const handleMessageEdit = (messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Starting message edit:', {
      messageId,
      operation: 'handleMessageEdit',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
  };

  const handleMessageSave = (messageId: string, content: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Saving message edit:', {
      messageId,
      contentLength: content.length,
      operation: 'handleMessageSave',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'SAVE_MESSAGE_EDIT', payload: { messageId, content } });
  };

  const handleMessageCancel = (messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Canceling message edit:', {
      messageId,
      operation: 'handleMessageCancel',
      timestamp: new Date().toISOString()
    });
    dispatch({ type: 'CANCEL_MESSAGE_EDIT', payload: { messageId } });
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
    retryMessage: (messageId: string) => {
      logger.info(LogCategory.STATE, 'MessageContext', 'Retrying message:', {
        messageId,
        operation: 'retryMessage',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'RETRY_MESSAGE', payload: { messageId } });
    },
    clearMessages: () => {
      logger.info(LogCategory.STATE, 'MessageContext', 'Clearing all messages', {
        operation: 'clearMessages',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'CLEAR_MESSAGES' });
    },
    retryLoading: () => {
      logger.info(LogCategory.STATE, 'MessageContext', 'Retrying loading', {
        operation: 'retryLoading',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'CLEAR_ERROR' });
    },
    confirmMessage: (tempId: string, confirmedMessage: Message) => {
      logger.info(LogCategory.STATE, 'MessageContext', 'Confirming message:', {
        tempId,
        confirmedId: confirmedMessage.id,
        operation: 'confirmMessage',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
    },
    handleMessageFailure: (messageId: string, error: string) => {
      logger.error(LogCategory.STATE, 'MessageContext', 'Message failed:', {
        messageId,
        error,
        operation: 'handleMessageFailure',
        timestamp: new Date().toISOString()
      });
      dispatch({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
    }
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
    const error = new Error('useMessages must be used within a MessageProvider');
    logger.error(LogCategory.ERROR, 'MessageContext', 'Context error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
  return context;
};