import { MessageState, MessageAction } from '@/types/messageContext';
import { logger, LogCategory } from '@/utils/logging';

export const editingReducer = (state: MessageState, action: MessageAction): MessageState => {
  switch (action.type) {
    case 'START_MESSAGE_EDIT': {
      logger.debug(LogCategory.STATE, 'editingReducer', 'Starting message edit:', {
        messageId: action.payload.messageId
      });

      return {
        ...state,
        editingMessageId: action.payload.messageId,
        error: null
      };
    }

    case 'SAVE_MESSAGE_EDIT': {
      const { messageId, content } = action.payload;
      
      logger.debug(LogCategory.STATE, 'editingReducer', 'Saving message edit:', {
        messageId,
        contentLength: content.length
      });

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
      logger.debug(LogCategory.STATE, 'editingReducer', 'Canceling message edit');
      
      return {
        ...state,
        editingMessageId: null,
        error: null
      };
    }

    default:
      return state;
  }
};