import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealTime } from '@/contexts/RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageQuery = (chatId: string | null) => {
  const { lastMessage } = useRealTime();

  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: async (): Promise<Message[]> => {
      if (!chatId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error(LogCategory.QUERY, 'useMessageQuery', 'Failed to fetch messages', {
          error,
          chatId,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      return data;
    },
    enabled: !!chatId,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });
};