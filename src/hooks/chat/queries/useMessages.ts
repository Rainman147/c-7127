import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';
import { Message, DbMessage } from '@/types/message';
import { transformDbMessageToMessage } from '../transformers/messageTransformer';

export const useMessages = (chatId: string | null) => {
  console.log('[useMessages] Initializing with chatId:', chatId);
  
  return useQuery({
    queryKey: messageKeys.chat(chatId),
    queryFn: async (): Promise<Message[]> => {
      console.log('[useMessages] Fetching messages for chat:', chatId);
      if (!chatId) return [];
      
      // Try to get from localStorage first
      const cachedMessages = localStorage.getItem(`chat_messages_${chatId}`);
      if (cachedMessages) {
        console.log('[useMessages] Found cached messages');
        return JSON.parse(cachedMessages);
      }

      const { data: messagesWithContext, error } = await supabase
        .from('messages')
        .select(`
          *,
          template_contexts (
            id,
            template_id,
            system_instructions,
            metadata,
            version,
            created_at,
            updated_at,
            user_id
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('[useMessages] Error fetching messages:', error);
        throw error;
      }

      console.log('[useMessages] Successfully fetched messages:', messagesWithContext?.length);

      // Transform the messages with their template contexts
      const transformedMessages = (messagesWithContext || []).map(msg => {
        const message = transformDbMessageToMessage(msg as DbMessage);
        console.log('[useMessages] Transformed message:', message.id);
        return message;
      });

      // Cache the messages in localStorage
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(transformedMessages));

      return transformedMessages;
    },
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!chatId,
    meta: {
      errorMessage: 'Failed to fetch messages'
    }
  });
};