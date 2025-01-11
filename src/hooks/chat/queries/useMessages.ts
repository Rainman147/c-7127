import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';
import { Message, DbMessage } from '@/types/message';
import { transformDbMessageToMessage } from '../transformers/messageTransformer';

export const useMessages = (chatId: string | null) => {
  console.log('[useMessages] Initializing with chatId:', chatId);
  
  return useQuery({
    queryKey: chatId ? messageKeys.chat(chatId) : null,
    queryFn: async (): Promise<Message[]> => {
      console.log('[useMessages] Fetching messages for chat:', chatId);
      if (!chatId) return [];
      
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('[useMessages] Error fetching messages:', error);
        throw error;
      }
      
      return (dbMessages as DbMessage[] || []).map(transformDbMessageToMessage);
    },
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!chatId,
  });
};