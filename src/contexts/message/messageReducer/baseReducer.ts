import { MessageState, MessageAction } from '@/types/messageContext';
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

export const baseReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'baseReducer', 'Processing action:', {
    type: action.type,
    currentState: {
      messageCount: state.messages.length,
      pendingCount: state.pendingMessages.length,
      isProcessing: state.isProcessing
    }
  });

  switch (action.type) {
    case 'SET_LOADING_STATE':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.value
        }
      };

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