import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import type { Message } from '@/types/chat';

export const useMessagePersistence = () => {
  const { toast } = useToast();
  const { status } = useSession();

  const saveMessageToSupabase = async (message: Message, chatId?: string) => {
    if (status !== 'validated') {
      console.log('[useMessagePersistence] Waiting for session validation...');
      return;
    }

    try {
      console.log('[useMessagePersistence] Saving message to Supabase');
      // First verify authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        throw new Error('You must be logged in to send messages');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User fetch error:', userError);
        throw new Error('You must be logged in to send messages');
      }

      if (!chatId) {
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            title: message.content.substring(0, 50),
            user_id: user.id
          })
          .select()
          .single();

        if (chatError) {
          console.error('Chat creation error:', chatError);
          throw chatError;
        }
        chatId = chatData.id;
      }

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: message.content,
          sender: message.role,
          type: message.type || 'text'
        })
        .select()
        .single();

      if (messageError) {
        console.error('Message save error:', messageError);
        throw messageError;
      }
      
      return { chatId, messageId: messageData.id };
    } catch (error: any) {
      console.error('[useMessagePersistence] Error saving message:', error);
      throw error;
    }
  };

  const loadChatMessages = async (chatId: string) => {
    if (status !== 'validated') {
      console.log('[useMessagePersistence] Waiting for session validation before loading messages');
      return [];
    }

    try {
      console.log('[useMessagePersistence] Loading messages for chat:', chatId);
      
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[useMessagePersistence] Messages fetch error:', messagesError);
        throw messagesError;
      }

      console.log('[useMessagePersistence] Successfully fetched messages:', messages?.length);

      const messageIds = messages?.map(m => m.id) || [];
      
      if (messageIds.length === 0) {
        return [];
      }

      const { data: editedMessages, error: editsError } = await supabase
        .from('edited_messages')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: false });

      if (editsError) {
        console.error('[useMessagePersistence] Edits fetch error:', editsError);
        throw editsError;
      }

      const editedContentMap = (editedMessages || []).reduce((acc: Record<string, string>, edit) => {
        if (!acc[edit.message_id]) {
          acc[edit.message_id] = edit.edited_content;
        }
        return acc;
      }, {});

      return (messages || []).map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: editedContentMap[msg.id] || msg.content,
        type: msg.type as 'text' | 'audio',
        id: msg.id
      }));

    } catch (error: any) {
      console.error('[useMessagePersistence] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load chat messages",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    saveMessageToSupabase,
    loadChatMessages
  };
};
