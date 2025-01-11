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
        .single();
        
      if (messageError) {
        console.error('[useSendMessage] Error sending message:', messageError);
        throw messageError;
      }

      // If we have template context, save it
      if (templateContext && message) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error: contextError } = await supabase
          .from('template_contexts')
          .insert({
            message_id: message.id,
            chat_id: chatId,
            template_id: templateContext.templateId,
            system_instructions: templateContext.systemInstructions,
            user_id: user.id,
            metadata: {},
            version: 1
          });

        if (contextError) {
          console.error('[useSendMessage] Error saving template context:', contextError);
          throw contextError;
        }
      }

      const transformedMessage = transformDbMessageToMessage(message as DbMessage);
      console.log('[useSendMessage] Message sent successfully:', transformedMessage);

      // Update localStorage cache
      const cachedMessages = localStorage.getItem(`chat_messages_${chatId}`);
      if (cachedMessages) {
        const messages = JSON.parse(cachedMessages);
        messages.push(transformedMessage);
        localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
      }
      
      return transformedMessage;
    },
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: messageKeys.chat(newMessage.chatId) });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(messageKeys.chat(newMessage.chatId)) || [];

      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: newMessage.chatId,
        content: newMessage.content,
        role: 'user',
        type: newMessage.type || 'text',
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData<Message[]>(
        messageKeys.chat(newMessage.chatId),
        old => [...(old || []), optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      console.error('[useSendMessage] Error in mutation:', err);
      // Revert the optimistic update
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.chat(newMessage.chatId), context.previousMessages);
      }
    },
    onSettled: (data, error, variables) => {
      console.log('[useSendMessage] Invalidating queries after settled');
      queryClient.invalidateQueries({
        queryKey: messageKeys.chat(variables.chatId),
      });
    }
  });
};