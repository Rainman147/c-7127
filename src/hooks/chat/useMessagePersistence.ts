import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessagePersistence = () => {
  const { toast } = useToast();

  const loadChatMessages = async (
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ) => {
    try {
      console.log('[useMessagePersistence] Loading messages:', { chatId, limit, offset });
      
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (messagesError) throw messagesError;

      const messageIds = messages.map(m => m.id);
      const { data: editedMessages, error: editsError } = await supabase
        .from('edited_messages')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: false });

      if (editsError) throw editsError;

      const editedContentMap = editedMessages.reduce((acc: Record<string, string>, edit) => {
        if (!acc[edit.message_id]) {
          acc[edit.message_id] = edit.edited_content;
        }
        return acc;
      }, {});

      return messages.map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: editedContentMap[msg.id] || msg.content,
        type: msg.type as 'text' | 'audio',
        id: msg.id
      })).reverse(); // Reverse to get chronological order

    } catch (error: any) {
      console.error('[useMessagePersistence] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    saveMessageToSupabase,
    loadChatMessages
  };
};