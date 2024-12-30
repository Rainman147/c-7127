import { MessageState, MessageAction } from '@/types/messageContext';
import { mergeMessages } from '@/utils/messageUtils';
import { logger, LogCategory } from '@/utils/logging';

export const messageOperationsReducer = (state: MessageState, action: MessageAction): MessageState => {
  switch (action.type) {
    case 'SET_MESSAGES': {
      const mergedMessages = mergeMessages(
        state.messages,
        action.payload,
        state.pendingMessages
      );

      logger.debug(LogCategory.STATE, 'messageOperationsReducer', 'Setting messages:', {
        previousCount: state.messages.length,
        newCount: mergedMessages.length,
        pendingCount: state.pendingMessages.length
      });

      return {
        ...state,
        messages: mergedMessages,
        isProcessing: state.pendingMessages.length > 0,
        error: null
      };
    }

    case 'ADD_MESSAGE': {
      const newMessage = action.payload;
      
      logger.debug(LogCategory.STATE, 'messageOperationsReducer', 'Adding message:', {
        messageId: newMessage.id,
        isOptimistic: newMessage.isOptimistic
      });

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
      
      logger.debug(LogCategory.STATE, 'messageOperationsReducer', 'Updating message status:', {
        messageId,
        status
      });

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
      
      logger.debug(LogCategory.STATE, 'messageOperationsReducer', 'Updating message content:', {
        messageId,
        contentLength: content.length
      });

      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, content } : msg
        ),
        error: null
      };
    }

    default:
      return state;
  }
};