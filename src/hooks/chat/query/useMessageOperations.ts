import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageCache } from './useMessageCache';
import { useToast } from '@/hooks/use-toast';
import type { DatabaseMessage } from '@/types/database/messages';
import type { Message } from '@/types/chat';

const mapDatabaseMessageToMessage = (dbMessage: DatabaseMessage): Message => ({
  id: dbMessage.id,
  content: dbMessage.content,
  role: dbMessage.sender as 'user' | 'assistant',
  type: dbMessage.type as 'text' | 'audio',
  sequence: dbMessage.sequence || undefined,
  created_at: dbMessage.created_at
});

export const useMessageOperations = (chatId: string | null) => {
  const { toast } = useToast();
  const { addMessageToCache, updateMessageInCache } = useMessageCache(chatId);

  const addMessage = useMutation({
    mutationFn: async (newMessage: Omit<DatabaseMessage, 'id' | 'created_at'>) => {
      logger.debug(LogCategory.COMMUNICATION, 'MessageOperations', 'Adding new message:', {
        chatId: newMessage.chat_id,
        type: newMessage.type
      });

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.ERROR, 'MessageOperations', 'Error adding message:', {
          error,
          chatId: newMessage.chat_id
        });
        throw error;
      }

      return mapDatabaseMessageToMessage(data as DatabaseMessage);
    },
    onSuccess: (newMessage) => {
      logger.debug(LogCategory.STATE, 'MessageOperations', 'Message added successfully:', {
        messageId: newMessage.id,
        chatId
      });
      addMessageToCache(newMessage);
    },
    onError: (error: Error) => {
      logger.error(LogCategory.ERROR, 'MessageOperations', 'Add message error:', {
        error,
        chatId
      });
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateMessage = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      logger.debug(LogCategory.COMMUNICATION, 'MessageOperations', 'Updating message:', {
        messageId: id,
        chatId
      });

      const { data, error } = await supabase
        .from('messages')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.ERROR, 'MessageOperations', 'Error updating message:', {
          error,
          messageId: id,
          chatId
        });
        throw error;
      }

      return mapDatabaseMessageToMessage(data as DatabaseMessage);
    },
    onSuccess: (updatedMessage) => {
      logger.debug(LogCategory.STATE, 'MessageOperations', 'Message updated successfully:', {
        messageId: updatedMessage.id,
        chatId
      });
      updateMessageInCache(updatedMessage);
    },
    onError: (error: Error) => {
      logger.error(LogCategory.ERROR, 'MessageOperations', 'Update message error:', {
        error,
        chatId
      });
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    addMessage,
    updateMessage
  };
};