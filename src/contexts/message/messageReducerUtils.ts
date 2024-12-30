import type { MessageState } from '@/types/messageContext';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const updateMessageInState = (
  messages: Message[],
  messageId: string,
  updateFn: (message: Message) => Message
): Message[] => {
  return messages.map(msg =>
    msg.id === messageId ? updateFn(msg) : msg
  );
};

export const handleSetMessages = (
  state: MessageState,
  messages: Message[]
): MessageState => {
  logger.info(LogCategory.STATE, 'MessageReducer', 'Setting messages:', {
    messageCount: messages.length,
    messageIds: messages.map(m => m.id)
  });

  return {
    ...state,
    messages,
    pendingMessages: [],
    isProcessing: false,
    error: null
  };
};

export const handleAddMessage = (
  state: MessageState,
  message: Message
): MessageState => {
  logger.debug(LogCategory.STATE, 'MessageReducer', 'Adding message:', {
    messageId: message.id,
    isOptimistic: message.isOptimistic
  });

  return {
    ...state,
    messages: [...state.messages, message],
    pendingMessages: message.isOptimistic 
      ? [...state.pendingMessages, message]
      : state.pendingMessages,
    isProcessing: true,
    error: null
  };
};

export const handleConfirmMessage = (
  state: MessageState,
  tempId: string,
  confirmedMessage: Message
): MessageState => {
  logger.info(LogCategory.STATE, 'MessageReducer', 'Confirming message:', {
    tempId,
    confirmedId: confirmedMessage.id
  });

  return {
    ...state,
    messages: state.messages.map(msg =>
      msg.id === tempId ? confirmedMessage : msg
    ),
    pendingMessages: state.pendingMessages.filter(msg => msg.id !== tempId),
    isProcessing: state.pendingMessages.length > 1,
    error: null
  };
};

export const handleMessageFailure = (
  state: MessageState,
  messageId: string,
  error: string
): MessageState => {
  const failedMessage = state.pendingMessages.find(msg => msg.id === messageId);
  if (!failedMessage) return state;

  logger.error(LogCategory.ERROR, 'MessageReducer', 'Message failed:', {
    messageId,
    error
  });

  return {
    ...state,
    pendingMessages: state.pendingMessages.filter(msg => msg.id !== messageId),
    messages: state.messages.filter(msg => msg.id !== messageId),
    isProcessing: state.pendingMessages.length > 1,
    error
  };
};