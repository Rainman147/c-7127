import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';
import { Message, DbMessage } from '@/types/message';
import { transformMessageToDb, transformDbMessageToMessage } from '../transformers/messageTransformer';

interface SendMessageVariables {
  content: string;
  chatId: string;
  type?: 'text' | 'audio';
  templateContext?: {
    templateId: string;
    systemInstructions: string;
  };
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ content, chatId, type = 'text', templateContext }: SendMessageVariables): Promise<Message> => {
      console.log('[useSendMessage] Sending message:', { content, chatId, type, templateContext });
      
      const messageData = transformMessageToDb({
        chatId,
        content,
        type,
        role: 'user',
        status: 'sending',
        templateContext,
      } as Message);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
        
      if (error) {
        console.error('[useSendMessage] Error sending message:', error);
        throw error;
      }

      const message = transformDbMessageToMessage(data as DbMessage);
      console.log('[useSendMessage] Message sent successfully:', message);
      
      return message;
    },
    onSuccess: (data, variables) => {
      console.log('[useSendMessage] Updating cache after successful send');
      queryClient.invalidateQueries({
        queryKey: messageKeys.chat(variables.chatId),
      });
    },
    onError: (error) => {
      console.error('[useSendMessage] Error in mutation:', error);
    }
  });
};