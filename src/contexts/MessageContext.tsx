import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { messageReducer, initialState } from './message/messageReducer';
import type { Message, MessageStatus } from '@/types/chat';
import type { MessageContextType } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatchWithLogging = useCallback((action: any) => {
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
        isProcessing: prevState.isProcessing,
        loadingStates: prevState.loadingStates,
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
        processingChanged: state.isProcessing !== prevState.isProcessing,
        loadingStatesChanged: JSON.stringify(state.loadingStates) !== JSON.stringify(prevState.loadingStates),
        errorChanged: state.error !== prevState.error
      }
    });
  }, []);

  const setLoadingState = useCallback((key: keyof MessageState['loadingStates'], value: boolean) => {
    dispatchWithLogging({ type: 'SET_LOADING_STATE', payload: { key, value } });
  }, [dispatchWithLogging]);

  const setMessages = useCallback((messages: Message[]) => {
    dispatchWithLogging({ type: 'SET_MESSAGES', payload: messages });
  }, [dispatchWithLogging]);
  
  const addMessage = useCallback((message: Message) => {
    dispatchWithLogging({ type: 'ADD_MESSAGE', payload: message });
  }, [dispatchWithLogging]);
  
  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatchWithLogging({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, [dispatchWithLogging]);
  
  const updateMessageContent = useCallback((messageId: string, content: string) => {
    dispatchWithLogging({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
  }, [dispatchWithLogging]);
  
  const handleMessageEdit = useCallback((messageId: string) => {
    dispatchWithLogging({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
  }, [dispatchWithLogging]);
  
  const handleMessageSave = useCallback((messageId: string, content: string) => {
    dispatchWithLogging({ type: 'SAVE_MESSAGE_EDIT', payload: { messageId, content } });
  }, [dispatchWithLogging]);
  
  const handleMessageCancel = useCallback((messageId: string) => {
    dispatchWithLogging({ type: 'CANCEL_MESSAGE_EDIT', payload: { messageId } });
  }, [dispatchWithLogging]);
  
  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    dispatchWithLogging({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
  }, [dispatchWithLogging]);
  
  const handleMessageFailure = useCallback((messageId: string, error: string) => {
    dispatchWithLogging({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
  }, [dispatchWithLogging]);
  
  const retryMessage = useCallback((messageId: string) => {
    dispatchWithLogging({ type: 'RETRY_MESSAGE', payload: { messageId } });
  }, [dispatchWithLogging]);
  
  const clearMessages = useCallback(() => {
    dispatchWithLogging({ type: 'CLEAR_MESSAGES', payload: null });
  }, [dispatchWithLogging]);
  
  const retryLoading = useCallback(() => {
    dispatchWithLogging({ type: 'CLEAR_ERROR', payload: null });
  }, [dispatchWithLogging]);

  const value: MessageContextType = {
    ...state,
    setMessages,
    addMessage,
    updateMessageStatus,
    updateMessageContent,
    handleMessageEdit,
    handleMessageSave,
    handleMessageCancel,
    confirmMessage,
    handleMessageFailure,
    retryMessage,
    clearMessages,
    retryLoading,
    setLoadingState
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
