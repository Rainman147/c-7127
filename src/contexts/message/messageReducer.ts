import { MessageState, MessageAction } from '@/types/messageContext';
import { MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  confirmedMessages: [],
  failedMessages: [],
  isProcessing: false,
  editingMessageId: null,
  error: null
};

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageContext', 'Reducer action:', { 
    type: action.type,
    currentMessageCount: state.messages.length,
    timestamp: new Date().toISOString()
  });

  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        pendingMessages: [],
        confirmedMessages: action.payload,
        failedMessages: [],
        isProcessing: false,
        error: null
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        pendingMessages: action.payload.isOptimistic 
          ? [...state.pendingMessages, action.payload]
          : state.pendingMessages,
        isProcessing: true,
        error: null
      };

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, status: action.payload.status }
            : message
        ),
        error: null
      };

    case 'UPDATE_MESSAGE_CONTENT':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, content: action.payload.content }
            : message
        ),
        error: null
      };

    case 'START_MESSAGE_EDIT':
      return {
        ...state,
        editingMessageId: action.payload.messageId,
        error: null
      };

    case 'SAVE_MESSAGE_EDIT':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, content: action.payload.content }
            : message
        ),
        editingMessageId: null,
        error: null
      };

    case 'CANCEL_MESSAGE_EDIT':
      return {
        ...state,
        editingMessageId: null,
        error: null
      };

    case 'CONFIRM_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.tempId ? action.payload.confirmedMessage : msg
        ),
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== action.payload.tempId),
        confirmedMessages: [...state.confirmedMessages, action.payload.confirmedMessage],
        isProcessing: state.pendingMessages.length > 1,
        error: null
      };

    case 'HANDLE_MESSAGE_FAILURE':
      const failedMessage = state.pendingMessages.find(msg => msg.id === action.payload.messageId);
      if (!failedMessage) return state;

      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, status: 'error' as MessageStatus }
            : message
        ),
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== action.payload.messageId),
        failedMessages: [...state.failedMessages, { ...failedMessage, error: action.payload.error }],
        isProcessing: state.pendingMessages.length > 1,
        error: action.payload.error
      };

    case 'RETRY_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, status: 'pending' as MessageStatus }
            : message
        ),
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'CLEAR_ERROR':
      logger.info(LogCategory.STATE, 'MessageContext', 'Clearing error state');
      return {
        ...state,
        error: null
      };

    case 'CLEAR_MESSAGES':
      logger.info(LogCategory.STATE, 'MessageContext', 'Clearing all messages');
      return initialState;

    default:
      return state;
  }
};