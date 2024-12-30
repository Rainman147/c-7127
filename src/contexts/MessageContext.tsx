import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { messageReducer, initialState } from './message/messageReducer';
import { sendMessage, editMessage } from './message/messageOperations';
import { supabase } from '@/integrations/supabase/client';
import type { MessageContextType } from '@/types/messageContext';
import type { Message, MessageStatus, MessageRole } from '@/types/chat';

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const { toast } = useToast();

  const setMessages = useCallback((messages: Message[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const handleMessageSend = useCallback(async (content: string, chatId: string, type: 'text' | 'audio' = 'text', sequence: number) => {
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      role: 'user' as MessageRole,
      sequence: state.messages.length,
      status: 'sending' as MessageStatus,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    addMessage(optimisticMessage);

    try {
      const message = await sendMessage(content, chatId, type, sequence);
      
      dispatch({ 
        type: 'CONFIRM_MESSAGE', 
        payload: { 
          tempId: optimisticMessage.id, 
          confirmedMessage: message
        }
      });

      return message;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Error sending message:', error);
      handleMessageFailure(optimisticMessage.id, error as string);
      throw error;
    }
  }, [state.messages.length, addMessage]);

  const handleMessageEdit = useCallback((messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Starting edit for message:', {
      messageId
    });
    dispatch({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
  }, []);

  const retryMessage = useCallback(async (messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Retrying message:', { messageId });
    
    const failedMessage = state.failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Failed message not found:', { messageId });
      return;
    }

    dispatch({ type: 'RETRY_MESSAGE', payload: { messageId } });

    try {
      await sendMessage(failedMessage.content, failedMessage.id.split('-')[0], failedMessage.type, failedMessage.sequence || 0);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Error retrying message:', error);
      toast({
        title: "Error",
        description: "Failed to retry message",
        variant: "destructive"
      });
    }
  }, [state.failedMessages, toast]);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, []);

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
  }, []);

  const handleMessageSave = useCallback(async (messageId: string, content: string) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');
    await editMessage(messageId, content, userId);
  }, []);

  const handleMessageCancel = useCallback((messageId: string) => {
    dispatch({ type: 'CANCEL_MESSAGE_EDIT', payload: { messageId } });
  }, []);

  const confirmMessage = useCallback((tempId: string, confirmedMessage: Message) => {
    dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
  }, []);

  const handleMessageFailure = useCallback((messageId: string, error: string) => {
    dispatch({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const retryLoading = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
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
    confirmMessage,
    handleMessageFailure,
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