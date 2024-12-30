import { useCallback } from 'react';
import type { Message, MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageStateUpdates = (dispatch: React.Dispatch<any>) => {
  const setMessages = useCallback((messages: Message[]) => {
    logger.debug(LogCategory.STATE, 'MessageStateUpdates', 'Setting messages:', {
      count: messages.length
    });
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, [dispatch]);

  const addMessage = useCallback((message: Message) => {
    logger.debug(LogCategory.STATE, 'MessageStateUpdates', 'Adding message:', {
      id: message.id
    });
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, [dispatch]);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, [dispatch]);

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
  }, [dispatch]);

  const handleMessageEdit = useCallback((messageId: string) => {
    dispatch({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
  }, [dispatch]);

  const handleMessageSave = useCallback((messageId: string, content: string) => {
    dispatch({ type: 'SAVE_MESSAGE_EDIT', payload: { messageId, content } });
  }, [dispatch]);

  const handleMessageCancel = useCallback((messageId: string) => {
    dispatch({ type: 'CANCEL_MESSAGE_EDIT', payload: { messageId } });
  }, [dispatch]);

  return {
    setMessages,
    addMessage,
    updateMessageStatus,
    updateMessageContent,
    handleMessageEdit,
    handleMessageSave,
    handleMessageCancel
  };
};