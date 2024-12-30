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

const logStateChange = (
  action: MessageAction,
  prevState: MessageState,
  nextState: MessageState
) => {
  logger.debug(LogCategory.STATE, 'MessageReducer', 'State change:', {
    action: action.type,
    changes: {
      messageCount: {
        prev: prevState.messages.length,
        next: nextState.messages.length
      },
      pendingCount: {
        prev: prevState.pendingMessages.length,
        next: nextState.pendingMessages.length
      },
      processingState: {
        prev: prevState.isProcessing,
        next: nextState.isProcessing
      },
      loadingStates: {
        prev: prevState.loadingStates,
        next: nextState.loadingStates
      }
    }
  });
};

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  const startTime = performance.now();
  let nextState: MessageState;

  switch (action.type) {
    case 'SET_LOADING_STATE': {
      const { key, value } = action.payload;
      nextState = {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [key]: value
        }
      };
      break;
    }

    case 'SET_MESSAGES': {
      nextState = {
        ...state,
        messages: action.payload,
        pendingMessages: [],
        isProcessing: false,
        error: null
      };
      break;
    }

    case 'ADD_MESSAGE': {
      const newMessage = action.payload;
      nextState = {
        ...state,
        messages: [...state.messages, newMessage],
        pendingMessages: newMessage.isOptimistic 
          ? [...state.pendingMessages, newMessage]
          : state.pendingMessages,
        isProcessing: true,
        error: null
      };
      break;
    }

    case 'UPDATE_MESSAGE_STATUS': {
      const { messageId, status } = action.payload;
      const message = state.messages.find(msg => msg.id === messageId);
      
      if (message && !validateStateTransition(message, status)) {
        return state;
      }

      nextState = {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        ),
        error: null
      };
      break;
    }

    case 'UPDATE_MESSAGE_CONTENT': {
      const { messageId, content } = action.payload;
      nextState = {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, content } : msg
        ),
        error: null
      };
      break;
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
      nextState = {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId 
            ? { ...msg, content, isEditing: false, wasEdited: true }
            : msg
        ),
        editingMessageId: null,
        error: null
      };
      break;
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
      nextState = {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === tempId ? confirmedMessage : msg
        ),
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== tempId),
        isProcessing: state.pendingMessages.length > 1,
        error: null
      };
      break;
    }

    case 'HANDLE_MESSAGE_FAILURE': {
      const { messageId, error } = action.payload;
      nextState = {
        ...state,
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== messageId),
        isProcessing: state.pendingMessages.length > 1,
        error
      };
      break;
    }

    case 'RETRY_MESSAGE': {
      const { messageId } = action.payload;
      nextState = {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sending' } : msg
        ),
        isProcessing: true,
        error: null
      };
      break;
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

  const duration = performance.now() - startTime;
  logger.debug(LogCategory.PERFORMANCE, 'MessageReducer', 'Action processing time:', {
    type: action.type,
    duration,
    timestamp: new Date().toISOString()
  });

  logStateChange(action, state, nextState);
  return nextState;
};
