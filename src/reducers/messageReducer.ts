import { MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

export const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  confirmedMessages: [],
  failedMessages: [],
  isProcessing: false
};

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageContext', 'Reducer action:', { 
    type: action.type,
    currentMessageCount: state.messages.length
  });

  switch (action.type) {
    case 'SET_MESSAGES':
      logger.info(LogCategory.STATE, 'MessageContext', 'Setting messages:', {
        messageCount: action.payload.length,
        messageIds: action.payload.map(m => m.id)
      });

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

    case 'UPDATE_MESSAGE_CONTENT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, content: action.payload.content }
            : msg
        )
      };

    case 'START_MESSAGE_EDIT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, isEditing: true }
            : msg
        )
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
        )
      };

    case 'CANCEL_MESSAGE_EDIT':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, isEditing: false }
            : msg
        )
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
      logger.info(LogCategory.STATE, 'MessageContext', 'Clearing all messages');
      return initialState;

    default:
      return state;
  }
};