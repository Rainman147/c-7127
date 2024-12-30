import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
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
  
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatchWithLogging = useCallback((action: MessageAction) => {
    const startTime = performance.now();
    const prevState = stateRef.current;
    
    logger.info(LogCategory.STATE, 'MessageContext', 'Dispatching action:', {
      type: action.type,
      payload: action.type === 'SET_MESSAGES' 
        ? `Setting ${action.payload.length} messages` 
        : action.payload,
      currentState: {
        messageCount: prevState.messages.length,
        pendingCount: prevState.pendingMessages.length,
        confirmedCount: prevState.confirmedMessages.length,
        failedCount: prevState.failedMessages.length,
        isProcessing: prevState.isProcessing,
        editingMessageId: prevState.editingMessageId,
        error: prevState.error
      },
      timestamp: new Date().toISOString()
    });

    dispatch(action);
    
    logger.debug(LogCategory.STATE, 'MessageContext', 'Action completed:', {
      type: action.type,
      duration: performance.now() - startTime,
      stateChanges: {
        messageCountDiff: state.messages.length - prevState.messages.length,
        pendingCountDiff: state.pendingMessages.length - prevState.pendingMessages.length,
        confirmedCountDiff: state.confirmedMessages.length - prevState.confirmedMessages.length,
        failedCountDiff: state.failedMessages.length - prevState.failedMessages.length,
        processingChanged: state.isProcessing !== prevState.isProcessing,
        editingChanged: state.editingMessageId !== prevState.editingMessageId,
        errorChanged: state.error !== prevState.error
      }
    });
  }, []);

  const value: MessageContextType = {
    ...state,
    setMessages: useCallback((messages: Message[]) => {
      logger.info(LogCategory.STATE, 'MessageContext', 'Setting messages:', {
        messageCount: messages.length,
        messageIds: messages.map(m => m.id),
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'SET_MESSAGES', payload: messages });
    }, [dispatchWithLogging]),
    
    addMessage: useCallback((message: Message) => {
      logger.info(LogCategory.STATE, 'MessageContext', 'Adding message:', {
        messageId: message.id,
        isOptimistic: message.isOptimistic,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'ADD_MESSAGE', payload: message });
    }, [dispatchWithLogging]),
    
    updateMessageStatus: useCallback((messageId: string, status: MessageStatus) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Updating message status:', {
        messageId,
        status,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
    }, [dispatchWithLogging]),
    
    updateMessageContent: useCallback((messageId: string, content: string) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Updating message content:', {
        messageId,
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
    }, [dispatchWithLogging]),

    handleMessageEdit: useCallback((messageId: string) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Editing message:', {
        messageId,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
    }, [dispatchWithLogging]),

    handleMessageSave: useCallback((messageId: string, content: string) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Saving message:', {
        messageId,
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'SAVE_MESSAGE_EDIT', payload: { messageId, content } });
    }, [dispatchWithLogging]),

    handleMessageCancel: useCallback((messageId: string) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Canceling message edit:', {
        messageId,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'CANCEL_MESSAGE_EDIT', payload: { messageId } });
    }, [dispatchWithLogging]),

    retryMessage: useCallback((messageId: string) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Retrying message:', {
        messageId,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'RETRY_MESSAGE', payload: { messageId } });
    }, [dispatchWithLogging]),

    clearMessages: useCallback(() => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Clearing all messages', {
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'CLEAR_MESSAGES' });
    }, [dispatchWithLogging]),

    retryLoading: useCallback(() => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Retrying loading', {
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'CLEAR_ERROR' });
    }, [dispatchWithLogging]),

    confirmMessage: useCallback((tempId: string, confirmedMessage: Message) => {
      logger.debug(LogCategory.STATE, 'MessageContext', 'Confirming message:', {
        tempId,
        confirmedId: confirmedMessage.id,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
    }, [dispatchWithLogging]),

    handleMessageFailure: useCallback((messageId: string, error: string) => {
      logger.error(LogCategory.STATE, 'MessageContext', 'Message failed:', {
        messageId,
        error,
        timestamp: new Date().toISOString()
      });
      dispatchWithLogging({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
    }, [dispatchWithLogging]),
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
