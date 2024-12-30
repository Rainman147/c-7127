import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { messageReducer, initialState } from './message/messageReducer';
import { sendMessage, editMessage } from './message/messageOperations';
import * as actions from './message/messageActions';
import type { MessageContextType } from '@/types/messageContext';
import type { Message, MessageStatus } from '@/types/chat';

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const { toast } = useToast();

  const setMessages = useCallback((messages: Message[]) => {
    dispatch(actions.setMessages(messages));
  }, []);

  const addMessage = useCallback((message: Message) => {
    dispatch(actions.addMessage(message));
  }, []);

  const handleMessageSend = useCallback(async (
    content: string,
    chatId: string,
    type: 'text' | 'audio' = 'text',
    sequence: number
  ) => {
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      role: 'user',
      sequence,
      status: 'sending',
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    addMessage(optimisticMessage);

    try {
      const message = await sendMessage(content, chatId, type, sequence);
      dispatch(actions.confirmMessage(optimisticMessage.id, message));
      return message;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Error sending message:', error);
      dispatch(actions.handleMessageFailure(optimisticMessage.id, error as string));
      throw error;
    }
  }, [addMessage]);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatch(actions.updateMessageStatus(messageId, status));
  }, []);

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    dispatch(actions.updateMessageContent(messageId, content));
  }, []);

  const handleMessageEdit = useCallback((messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Starting edit for message:', {
      messageId
    });
    dispatch(actions.startMessageEdit(messageId));
  }, []);

  const handleMessageSave = useCallback(async (messageId: string, content: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');
    await editMessage(messageId, content, userId);
    dispatch(actions.saveMessageEdit(messageId, content));
  }, []);

  const handleMessageCancel = useCallback((messageId: string) => {
    dispatch(actions.cancelMessageEdit(messageId));
  }, []);

  const retryMessage = useCallback(async (messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Retrying message:', { messageId });
    dispatch(actions.retryMessage(messageId));
  }, []);

  const clearMessages = useCallback(() => {
    dispatch(actions.clearMessages());
  }, []);

  const retryLoading = useCallback(() => {
    dispatch(actions.clearError());
  }, []);

  const value = {
    ...state,
    setMessages,
    addMessage,
    sendMessage: handleMessageSend,
    editMessage,
    retryMessage,
    updateMessageStatus,
    updateMessageContent,
    handleMessageEdit,
    handleMessageSave,
    handleMessageCancel,
    clearMessages,
    retryLoading
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};