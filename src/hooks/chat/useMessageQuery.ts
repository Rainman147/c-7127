import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import type { Message } from '@/types/chat';

const DEBOUNCE_MS = 100;

interface DatabaseMessage {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
  sequence: number | null;
}

const mapDatabaseMessageToMessage = (dbMessage: DatabaseMessage): Message => ({
  id: dbMessage.id,
  content: dbMessage.content,
  role: dbMessage.sender as 'user' | 'assistant',
  type: dbMessage.type as 'text' | 'audio',
  sequence: dbMessage.sequence || undefined,
  created_at: dbMessage.created_at
});

export const useMessageQuery = (chatId: string | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const debouncedInvalidate = debounce(
    () => queryClient.invalidateQueries({ 
      queryKey: ['messages', chatId] 
    }),
    DEBOUNCE_MS
  );

  const fetchMessages = async (id: string): Promise<Message[]> => {
    logger.debug(LogCategory.COMMUNICATION, 'useMessageQuery', 'Fetching messages:', { 
      chatId: id 
    });
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.ERROR, 'useMessageQuery', 'Error fetching messages:', { 
        error,
        chatId: id
      });
      throw error;
    }

    logger.debug(LogCategory.STATE, 'useMessageQuery', 'Messages fetched successfully:', {
      chatId: id,
      messageCount: data?.length || 0
    });

    return (data as DatabaseMessage[]).map(mapDatabaseMessageToMessage);
  };

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => chatId ? fetchMessages(chatId) : Promise.resolve([]),
    enabled: !!chatId,
    staleTime: 1000 * 60,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    meta: {
      errorHandler: (error: Error) => {
        logger.error(LogCategory.ERROR, 'useMessageQuery', 'Query error:', {
          error,
          chatId
        });
        ErrorTracker.trackError(error, {
          component: 'useMessageQuery',
          errorType: 'QueryError',
          severity: 'medium',
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  const addMessage = useMutation({
    mutationFn: async (newMessage: Omit<DatabaseMessage, 'id' | 'created_at'>) => {
      logger.debug(LogCategory.COMMUNICATION, 'useMessageQuery', 'Adding new message:', {
        chatId: newMessage.chat_id,
        type: newMessage.type
      });

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        logger.error(LogCategory.ERROR, 'useMessageQuery', 'Error adding message:', {
          error,
          chatId: newMessage.chat_id
        });
        throw error;
      }

      return mapDatabaseMessageToMessage(data as DatabaseMessage);
    },
    onSuccess: (newMessage) => {
      logger.debug(LogCategory.STATE, 'useMessageQuery', 'Message added successfully:', {
        messageId: newMessage.id,
        chatId
      });

      queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
        if (old.some(msg => msg.id === newMessage.id)) {
          return old;
        }
        return [...old, newMessage];
      });
      debouncedInvalidate();
    },
    onError: (error: Error) => {
      logger.error(LogCategory.ERROR, 'useMessageQuery', 'Mutation error:', {
        error,
        chatId
      });

      ErrorTracker.trackError(error, {
        component: 'useMessageQuery',
        errorType: 'MutationError',
        severity: 'medium',
        timestamp: new Date().toISOString()
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
      logger.debug(LogCategory.COMMUNICATION, 'useMessageQuery', 'Updating message:', {
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
        logger.error(LogCategory.ERROR, 'useMessageQuery', 'Error updating message:', {
          error,
          messageId: id,
          chatId
        });
        throw error;
      }

      return mapDatabaseMessageToMessage(data as DatabaseMessage);
    },
    onSuccess: (updatedMessage) => {
      logger.debug(LogCategory.STATE, 'useMessageQuery', 'Message updated successfully:', {
        messageId: updatedMessage.id,
        chatId
      });

      queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
        return old.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        );
      });
      debouncedInvalidate();
    },
    onError: (error: Error) => {
      logger.error(LogCategory.ERROR, 'useMessageQuery', 'Update error:', {
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
    messages: messages || [],
    isLoading,
    error,
    addMessage,
    updateMessage
  };
};