import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';
import { Message, DbMessage, TemplateContext } from '@/types/message';
import { transformDbMessageToMessage } from '../transformers/messageTransformer';

export const useMessages = (chatId: string | null) => {
  console.log('[useMessages] Initializing with chatId:', chatId);
  
  return useQuery({
    queryKey: chatId ? messageKeys.chat(chatId) : null,
    queryFn: async (): Promise<Message[]> => {
      console.log('[useMessages] Fetching messages for chat:', chatId);
      if (!chatId) return [];
      
      // Fetch messages with template contexts in a single query
      const { data: messagesWithContext, error } = await supabase
        .from('messages')
        .select(`
          *,
          template_contexts (*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('[useMessages] Error fetching messages:', error);
        throw error;
      }

      // Transform the messages with their template contexts
      return (messagesWithContext || []).map(msg => {
        const message = transformDbMessageToMessage(msg as DbMessage);
        if (msg.template_contexts?.[0]) {
          message.templateContext = msg.template_contexts[0] as TemplateContext;
        }
        return message;
      });
    },
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!chatId,
  });
};