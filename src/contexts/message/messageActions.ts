import type { Message, MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const setMessages = (messages: Message[]) => ({
  type: 'SET_MESSAGES' as const,
  payload: messages
});

export const addMessage = (message: Message) => {
  logger.debug(LogCategory.STATE, 'MessageActions', 'Adding message:', {
    messageId: message.id,
    isOptimistic: message.isOptimistic
  });
  return {
    type: 'ADD_MESSAGE' as const,
    payload: message
  };
};

export const updateMessageStatus = (messageId: string, status: MessageStatus) => ({
  type: 'UPDATE_MESSAGE_STATUS' as const,
  payload: { messageId, status }
});

export const updateMessageContent = (messageId: string, content: string) => ({
  type: 'UPDATE_MESSAGE_CONTENT' as const,
  payload: { messageId, content }
});

export const startMessageEdit = (messageId: string) => ({
  type: 'START_MESSAGE_EDIT' as const,
  payload: { messageId }
});

export const saveMessageEdit = (messageId: string, content: string) => ({
  type: 'SAVE_MESSAGE_EDIT' as const,
  payload: { messageId, content }
});

export const cancelMessageEdit = (messageId: string) => ({
  type: 'CANCEL_MESSAGE_EDIT' as const,
  payload: { messageId }
});

export const confirmMessage = (tempId: string, confirmedMessage: Message) => ({
  type: 'CONFIRM_MESSAGE' as const,
  payload: { tempId, confirmedMessage }
});

export const handleMessageFailure = (messageId: string, error: string) => ({
  type: 'HANDLE_MESSAGE_FAILURE' as const,
  payload: { messageId, error }
});

export const retryMessage = (messageId: string) => ({
  type: 'RETRY_MESSAGE' as const,
  payload: { messageId }
});

export const setError = (error: string) => ({
  type: 'SET_ERROR' as const,
  payload: error
});

export const clearError = () => ({
  type: 'CLEAR_ERROR' as const
});

export const clearMessages = () => ({
  type: 'CLEAR_MESSAGES' as const
});