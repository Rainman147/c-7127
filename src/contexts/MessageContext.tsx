import { createContext, useContext, useReducer, ReactNode } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { Message, MessageStatus } from '@/types/chat';

interface MessageState {
  messages: Message[];
  pendingMessages: Message[];
  confirmedMessages: Message[];
  failedMessages: Message[];
  isProcessing: boolean;
}

type MessageAction = 
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus } }
  | { type: 'CONFIRM_MESSAGE'; payload: { tempId: string; confirmedMessage: Message } }
  | { type: 'HANDLE_MESSAGE_FAILURE'; payload: { messageId: string; error: string } }
  | { type: 'CLEAR_MESSAGES' };

const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  confirmedMessages: [],
  failedMessages: [],
  isProcessing: false
};

const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        confirmedMessages: action.payload,
        pendingMessages: [],
        failedMessages: [],
        isProcessing: false
      };

    case 'ADD_MESSAGE':
      logger.debug(LogCategory.STATE, 'MessageContext', 'Adding message:', {
        messageId: action.payload.id,
        isOptimistic: action.payload.isOptimistic
      });
      return {
        ...state,
        messages: [...state.messages, action.payload],
        pendingMessages: action.payload.isOptimistic 
          ? [...state.pendingMessages, action.payload]
          : state.pendingMessages,
        isProcessing: true
      };

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, status: action.payload.status }
            : msg
        )
      };

    case 'CONFIRM_MESSAGE':
      logger.debug(LogCategory.STATE, 'MessageContext', 'Confirming message:', {
        tempId: action.payload.tempId,
        confirmedId: action.payload.confirmedMessage.id
      });
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.tempId ? action.payload.confirmedMessage : msg
        ),
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== action.payload.tempId),
        confirmedMessages: [...state.confirmedMessages, action.payload.confirmedMessage],
        isProcessing: state.pendingMessages.length > 1
      };

    case 'HANDLE_MESSAGE_FAILURE':
      const failedMessage = state.pendingMessages.find(msg => msg.id === action.payload.messageId);
      if (!failedMessage) return state;

      logger.error(LogCategory.ERROR, 'MessageContext', 'Message failed:', {
        messageId: action.payload.messageId,
        error: action.payload.error
      });

      return {
        ...state,
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== action.payload.messageId),
        failedMessages: [...state.failedMessages, { ...failedMessage, error: action.payload.error }],
        isProcessing: state.pendingMessages.length > 1
      };

    case 'CLEAR_MESSAGES':
      return initialState;

    default:
      return state;
  }
};

interface MessageContextType extends MessageState {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  confirmMessage: (tempId: string, confirmedMessage: Message) => void;
  handleMessageFailure: (messageId: string, error: string) => void;
  clearMessages: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);

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