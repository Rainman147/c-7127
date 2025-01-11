import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';
import { transformMessageToDb } from '../transformers/messageTransformer';
import type { Message } from '@/types/message';

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ content, chatId, type = 'text' }: { 
      content: string;
      chatId: string;
      type?: 'text' | 'audio';
    }) => {
      console.log('[useSendMessage] Sending message:', { content, chatId, type });
      
      const messageData = {
        chat_id: chatId,
        content,
        type,
        sender: 'user',
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
        
      if (error) {
        console.error('[useSendMessage] Error sending message:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('[useSendMessage] Message sent successfully:', data);
      queryClient.invalidateQueries({
        queryKey: messageKeys.chat(variables.chatId),
      });
    },
  });
};