import type { Message, MessageStatus } from '@/types/chat';
import type { MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

export const messageReducer = (
  state: MessageState,
  action: MessageAction
): MessageState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        error: null
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
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
        messages: state.messages.map(message =>
          message.id === action.payload.tempId
            ? { ...action.payload.confirmedMessage }
            : message
        ),
        error: null
      };

    case 'HANDLE_MESSAGE_FAILURE':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, status: 'error' as MessageStatus }
            : message
        ),
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
      return {
        ...state,
        error: null
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        editingMessageId: null,
        error: null
      };

    default:
      return state;
  }
};