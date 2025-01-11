import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';
import { transformDbMessageToMessage } from '../transformers/messageTransformer';
import type { Message } from '@/types/message';

export const useMessages = (chatId: string | null) => {
  console.log('[useMessages] Initializing with chatId:', chatId);
  
  return useQuery({
    queryKey: chatId ? messageKeys.chat(chatId) : null,
    queryFn: async () => {
      console.log('[useMessages] Fetching messages for chat:', chatId);
      if (!chatId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('[useMessages] Error fetching messages:', error);
        throw error;
      }
      
      return (data || []).map(transformDbMessageToMessage);
    },
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!chatId,
  });
};