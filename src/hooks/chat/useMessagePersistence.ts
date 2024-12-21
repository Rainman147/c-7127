import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessagePersistence = () => {
  const { toast } = useToast();

  const saveMessageToSupabase = async (
    message: Message,
    chatId?: string
  ) => {
    try {
      console.log('[useMessagePersistence] Saving message:', { 
        chatId, 
        type: message.type,
        contentPreview: message.content.substring(0, 50) + '...'
      });

      // If no chatId, create a new chat
      let finalChatId = chatId;
      if (!chatId) {
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert([{ title: 'New Chat' }])
          .select()
          .single();

        if (chatError) throw chatError;
        finalChatId = chat.id;
      }

      // Save the message
      const { data: savedMessage, error: messageError } = await supabase
        .from('messages')
        .insert([{
          chat_id: finalChatId,
          content: message.content,
          sender: message.role,
          type: message.type || 'text'
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      console.log('[useMessagePersistence] Message saved successfully:', savedMessage.id);
      return { chatId: finalChatId, messageId: savedMessage.id };

    } catch (error: any) {
      console.error('[useMessagePersistence] Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive"
      });
      return null;
    }
  };

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

      console.log('[useMessagePersistence] Messages loaded:', messages.length);
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