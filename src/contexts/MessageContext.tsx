import { createContext, useContext, useCallback, useReducer, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { messageReducer, initialState } from '@/reducers/messageReducer';
import type { MessageContextType, MessageState } from '@/types/messageContext';
import type { Message, MessageStatus } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const { toast } = useToast();

  logger.debug(LogCategory.STATE, 'MessageContext', 'Provider state update:', {
    messageCount: state.messages.length,
    pendingCount: state.pendingMessages.length,
    confirmedCount: state.confirmedMessages.length,
    failedCount: state.failedMessages.length
  });

  const setMessages = useCallback((messages: Message[]) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Setting messages:', {
      count: messages.length,
      messageIds: messages.map(m => m.id)
    });
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, []);

  const addMessage = useCallback((message: Message) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Adding message:', {
      id: message.id,
      status: message.status,
      isOptimistic: message.isOptimistic
    });
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const sendMessage = useCallback(async (content: string, chatId: string, type: 'text' | 'audio' = 'text') => {
    logger.info(LogCategory.COMMUNICATION, 'MessageContext', 'Sending message:', {
      chatId,
      type,
      contentLength: content.length
    });

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      type,
      role: 'user',
      sequence: state.messages.length,
      status: 'sending',
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    addMessage(optimisticMessage);

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content,
          type,
          sender: 'user',
          sequence: state.messages.length,
          status: 'delivered'
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.STATE, 'MessageContext', 'Message sent successfully:', {
        messageId: message.id
      });

      dispatch({ 
        type: 'CONFIRM_MESSAGE', 
        payload: { 
          tempId: optimisticMessage.id, 
          confirmedMessage: {
            ...message,
            role: message.sender,
            status: message.status || 'delivered'
          }
        }
      });

      return message;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Error sending message:', error);
      handleMessageFailure(optimisticMessage.id, error as string);
      throw error;
    }
  }, [state.messages.length, addMessage]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Editing message:', {
      messageId,
      contentLength: content.length
    });

    try {
      const { data: editedMessage, error } = await supabase
        .from('edited_messages')
        .upsert({
          message_id: messageId,
          edited_content: content,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'SAVE_MESSAGE_EDIT', payload: { messageId, content } });

      logger.info(LogCategory.STATE, 'MessageContext', 'Message edited successfully:', {
        messageId,
        editId: editedMessage.id
      });

      return editedMessage;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to save message changes",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const retryMessage = useCallback(async (messageId: string) => {
    logger.info(LogCategory.STATE, 'MessageContext', 'Retrying message:', { messageId });
    
    const failedMessage = state.failedMessages.find(msg => msg.id === messageId);
    if (!failedMessage) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Failed message not found:', { messageId });
      return;
    }

    // Remove from failed messages and add back to pending
    dispatch({ type: 'RETRY_MESSAGE', payload: { messageId } });

    try {
      await sendMessage(failedMessage.content, failedMessage.id.split('-')[0], failedMessage.type);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'MessageContext', 'Error retrying message:', error);
      toast({
        title: "Error",
        description: "Failed to retry message",
        variant: "destructive"
      });
    }
  }, [state.failedMessages, sendMessage, toast]);

  const updateMessageStatus = useCallback((messageId: string, status: MessageStatus) => {
    dispatch({ type: 'UPDATE_MESSAGE_STATUS', payload: { messageId, status } });
  }, []);

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    dispatch({ type: 'UPDATE_MESSAGE_CONTENT', payload: { messageId, content } });
  }, []);

  const handleMessageEdit = useCallback((messageId: string) => {
    dispatch({ type: 'START_MESSAGE_EDIT', payload: { messageId } });
  }, []);

  const handleMessageSave = useCallback(async (messageId: string, content: string) => {
    await editMessage(messageId, content);
  }, [editMessage]);

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
    sendMessage,
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
