import { MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

export const confirmationReducer = (state: MessageState, action: MessageAction): MessageState => {
  switch (action.type) {
    case 'CONFIRM_MESSAGE': {
      const { tempId, confirmedMessage } = action.payload;
      
      logger.debug(LogCategory.STATE, 'confirmationReducer', 'Confirming message:', {
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
    }

    case 'HANDLE_MESSAGE_FAILURE': {
      const { messageId, error } = action.payload;
      
      logger.error(LogCategory.ERROR, 'confirmationReducer', 'Message failure:', {
        messageId,
        error
      });

      return {
        ...state,
        pendingMessages: state.pendingMessages.filter(msg => msg.id !== messageId),
        isProcessing: state.pendingMessages.length > 1,
        error
      };
    }

    case 'RETRY_MESSAGE': {
      const { messageId } = action.payload;
      
      logger.info(LogCategory.STATE, 'confirmationReducer', 'Retrying message:', {
        messageId
      });

      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, status: 'sending' } : msg
        ),
        isProcessing: true,
        error: null
      };
    }

    default:
      return state;
  }
};