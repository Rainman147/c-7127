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
      } as Message);
      
      // Start a Supabase transaction
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
        
      if (messageError) {
        console.error('[useSendMessage] Error sending message:', messageError);
        throw messageError;
      }

      // If we have template context, save it
      if (templateContext && message) {
        const { error: contextError } = await supabase
          .from('template_contexts')
          .insert({
            message_id: message.id,
            chat_id: chatId,
            template_id: templateContext.templateId,
            system_instructions: templateContext.systemInstructions,
          });

        if (contextError) {
          console.error('[useSendMessage] Error saving template context:', contextError);
          throw contextError;
        }
      }

      const transformedMessage = transformDbMessageToMessage(message as DbMessage);
      console.log('[useSendMessage] Message sent successfully:', transformedMessage);
      
      return transformedMessage;
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