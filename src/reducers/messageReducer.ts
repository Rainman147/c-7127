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

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageReducer', 'Processing action:', { 
    type: action.type,
    currentMessageCount: state.messages.length,
    actionPayload: action.type === 'SET_MESSAGES' ? {
      messageCount: action.payload.length,
      messageIds: action.payload.map(m => m.id)
    } : action.payload
  });

  switch (action.type) {
    case 'SET_MESSAGES': {
      logger.debug(LogCategory.STATE, 'MessageReducer', 'Current local messages before SET_MESSAGES:', {
        messages: state.messages.map(m => ({
          id: m.id,
          status: m.status,
          isOptimistic: m.isOptimistic
        })),
        pendingMessages: state.pendingMessages.map(m => m.id)
      });

      const newMessages = action.payload.filter(msg => 
        !state.pendingMessages.some(pending => pending.id === msg.id)
      );
      
      const updatedState = {
        ...state,
        messages: [...newMessages, ...state.pendingMessages],
        isProcessing: state.pendingMessages.length > 0,
        error: null
      };

      logger.debug(LogCategory.STATE, 'MessageReducer', 'Final state after SET_MESSAGES:', {
        messageCount: updatedState.messages.length,
        messageIds: updatedState.messages.map(m => m.id),
        pendingCount: updatedState.pendingMessages.length,
        isProcessing: updatedState.isProcessing
      });

      return updatedState;
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