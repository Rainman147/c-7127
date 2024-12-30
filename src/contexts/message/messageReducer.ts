import { MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';
import {
  updateMessageInState,
  handleSetMessages,
  handleAddMessage,
  handleConfirmMessage,
  handleMessageFailure
} from './messageReducerUtils';

export const initialState: MessageState = {
  messages: [],
  pendingMessages: [],
  confirmedMessages: [],
  failedMessages: [],
  isProcessing: false,
  error: null
};

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageReducer', 'Processing action:', { 
    type: action.type,
    currentMessageCount: state.messages.length
  });

  switch (action.type) {
    case 'SET_MESSAGES':
      return handleSetMessages(state, action.payload);

    case 'ADD_MESSAGE':
      return handleAddMessage(state, action.payload);

    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.messageId,
          msg => ({ ...msg, status: action.payload.status })
        ),
        error: null
      };

    case 'UPDATE_MESSAGE_CONTENT':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.messageId,
          msg => ({ ...msg, content: action.payload.content })
        ),
        error: null
      };

    case 'START_MESSAGE_EDIT':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.messageId,
          msg => ({ ...msg, isEditing: true })
        ),
        error: null
      };

    case 'SAVE_MESSAGE_EDIT':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.messageId,
          msg => ({
            ...msg,
            content: action.payload.content,
            isEditing: false,
            wasEdited: true
          })
        ),
        error: null
      };

    case 'CANCEL_MESSAGE_EDIT':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.messageId,
          msg => ({ ...msg, isEditing: false })
        ),
        error: null
      };

    case 'CONFIRM_MESSAGE':
      return handleConfirmMessage(
        state,
        action.payload.tempId,
        action.payload.confirmedMessage
      );

    case 'HANDLE_MESSAGE_FAILURE':
      return handleMessageFailure(
        state,
        action.payload.messageId,
        action.payload.error
      );

    case 'RETRY_MESSAGE': {
      const failedMessage = state.failedMessages.find(
        msg => msg.id === action.payload.messageId
      );
      if (!failedMessage) return state;

      logger.info(LogCategory.STATE, 'MessageReducer', 'Retrying message:', {
        messageId: action.payload.messageId
      });

      return {
        ...state,
        failedMessages: state.failedMessages.filter(
          msg => msg.id !== action.payload.messageId
        ),
        pendingMessages: [
          ...state.pendingMessages,
          { ...failedMessage, status: 'sending' }
        ],
        messages: updateMessageInState(
          state.messages,
          action.payload.messageId,
          msg => ({ ...msg, status: 'sending' })
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
      logger.info(LogCategory.STATE, 'MessageReducer', 'Clearing all messages');
      return initialState;

    default:
      return state;
  }
};