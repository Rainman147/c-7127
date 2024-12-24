import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { Message } from '@/types/chat';

const MESSAGES_QUERY_KEY = 'messages';

export const useMessageQuery = (chatId: string | null) => {
  const queryClient = useQueryClient();

  const fetchMessages = async (id: string): Promise<Message[]> => {
    logger.debug(LogCategory.COMMUNICATION, 'useMessageQuery', 'Fetching messages:', { chatId: id });
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.ERROR, 'useMessageQuery', 'Error fetching messages:', { error });
      throw error;
    }

    return data as Message[];
  };

  const { data: messages, isLoading, error } = useQuery({
    queryKey: [MESSAGES_QUERY_KEY, chatId],
    queryFn: () => chatId ? fetchMessages(chatId) : Promise.resolve([]),
    enabled: !!chatId,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    onError: (error: Error) => {
      ErrorTracker.trackError(error, {
        component: 'useMessageQuery',
        errorType: 'QueryError',
        severity: 'medium'
      });
    }
  });

  const addMessage = useMutation({
    mutationFn: async (newMessage: Omit<Message, 'id'>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>([MESSAGES_QUERY_KEY, chatId], (old = []) => {
        return [...old, newMessage];
      });
    },
    onError: (error: Error) => {
      ErrorTracker.trackError(error, {
        component: 'useMessageQuery',
        errorType: 'MutationError',
        severity: 'medium'
      });
    }
  });

  const updateMessage = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData<Message[]>([MESSAGES_QUERY_KEY, chatId], (old = []) => {
        return old.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        );
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