import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys } from '@/types/chat';

interface EditMessageVariables {
  messageId: string;
  chatId: string;
  content: string;
}

export const useMessageEdit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, content, chatId }: EditMessageVariables): Promise<void> => {
      console.log('[useMessageEdit] Editing message:', { messageId, content });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('edited_messages')
        .insert({
          message_id: messageId,
          edited_content: content,
          user_id: user.id
        });

      if (error) {
        console.error('[useMessageEdit] Error editing message:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      console.log('[useMessageEdit] Message edited successfully');
      queryClient.invalidateQueries({
        queryKey: messageKeys.chat(variables.chatId),
      });
    },
    onError: (error) => {
      console.error('[useMessageEdit] Error in mutation:', error);
    }
  });
};