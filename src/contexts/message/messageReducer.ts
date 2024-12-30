import { MessageState, MessageAction } from '@/types/messageContext';
import { validateStateTransition } from '@/utils/messageStateValidator';
import { logger, LogCategory } from '@/utils/logging';

export const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  isProcessing: false,
  error: null,
  editingMessageId: null,
  loadingStates: {
    isSubmitting: false,
    isFetching: false,
    isProcessingOptimistic: false
  }
};

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageReducer', 'Processing action:', { 
    type: action.type,
    currentMessageCount: state.messages.length,
    loadingStates: state.loadingStates
  });

  switch (action.type) {
    case 'SET_LOADING_STATE': {
      const { key, value } = action.payload;
      logger.debug(LogCategory.STATE, 'MessageReducer', 'Updating loading state:', {
        key,
        value,
        previousState: state.loadingStates[key]
      });

      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [key]: value
        }
      };
    }

    case 'SET_MESSAGES': {
      logger.debug(LogCategory.STATE, 'MessageReducer', 'Setting messages:', {
        messageCount: action.payload.length
      });

      return {
        ...state,
        messages: action.payload,
        pendingMessages: [],
        isProcessing: false,
        error: null
      };
    }

    case 'ADD_MESSAGE': {
      const newMessage = action.payload;
      return {
        ...state,
        messages: [...state.messages, newMessage],
        pendingMessages: newMessage.isOptimistic 
          ? [...state.pendingMessages, newMessage]
          : state.pendingMessages,
        isProcessing: true,
        error: null
      };
    }

    case 'UPDATE_MESSAGE_STATUS': {
      const { messageId, status } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
        error: null
      };
    }

    case 'UPDATE_MESSAGE_CONTENT': {
      const { messageId, content } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, content } : msg
        ),
        error: null
      };
    }

    case 'START_MESSAGE_EDIT': {
      return {
        ...state,
        editingMessageId: action.payload.messageId,
        error: null
      };
    }

    case 'SAVE_MESSAGE_EDIT': {
      const { messageId, content } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId 
            ? { ...msg, content, isEditing: false, wasEdited: true }
            : msg
        ),
        editingMessageId: null,
        error: null
      };
    }

    case 'CANCEL_MESSAGE_EDIT': {
      return {
        ...state,
        editingMessageId: null,
        error: null
      };
    }

    case 'CONFIRM_MESSAGE': {
      const { tempId, confirmedMessage } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === tempId ? confirmedMessage : msg
        ),
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== tempId),
        isProcessing: state.pendingMessages.length > 1,
        error: null
      };
    }

    case 'HANDLE_MESSAGE_FAILURE': {
      const { messageId, error } = action.payload;
      return {
        ...state,
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== messageId),
        isProcessing: state.pendingMessages.length > 1,
        error
      };
    }

    case 'RETRY_MESSAGE': {
      const { messageId } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sending' } : msg
        ),
        isProcessing: true,
        error: null
      };
    }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'CLEAR_MESSAGES':
      return initialState;

    default:
      return state;
  }
};
