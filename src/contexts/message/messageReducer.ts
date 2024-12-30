import { MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

export const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  confirmedMessages: [],
  failedMessages: [],
  isProcessing: false,
  error: null
};

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageContext', 'Reducer action:', { 
    type: action.type,
    currentMessageCount: state.messages.length
  });

  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        confirmedMessages: action.payload,
        pendingMessages: [],
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
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, status: action.payload.status }
            : msg
        ),
        error: null
      };

    case 'UPDATE_MESSAGE_CONTENT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, content: action.payload.content }
            : msg
        ),
        error: null
      };

    case 'START_MESSAGE_EDIT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, isEditing: true }
            : msg
        ),
        error: null
      };

    case 'SAVE_MESSAGE_EDIT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { 
                ...msg, 
                content: action.payload.content,
                isEditing: false,
                wasEdited: true
              }
            : msg
        ),
        error: null
      };

    case 'CANCEL_MESSAGE_EDIT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, isEditing: false }
            : msg
        ),
        error: null
      };

    case 'CONFIRM_MESSAGE':
      logger.info(LogCategory.STATE, 'MessageContext', 'Confirming message:', {
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
        isProcessing: state.pendingMessages.length > 1,
        error: null
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
        isProcessing: state.pendingMessages.length > 1,
        error: action.payload.error
      };

    case 'RETRY_MESSAGE': {
      const failedMessage = state.failedMessages.find(msg => msg.id === action.payload.messageId);
      if (!failedMessage) return state;

      logger.info(LogCategory.STATE, 'MessageContext', 'Retrying message:', {
        messageId: action.payload.messageId
      });

      return {
        ...state,
        failedMessages: state.failedMessages.filter(msg => msg.id !== action.payload.messageId),
        pendingMessages: [...state.pendingMessages, { ...failedMessage, status: 'sending' }],
        messages: state.messages.map(msg => 
          msg.id === action.payload.messageId 
            ? { ...msg, status: 'sending' } 
            : msg
        ),
        isProcessing: true,
        error: null
      };
    }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'CLEAR_ERROR':
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
