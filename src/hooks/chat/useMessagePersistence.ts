import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import type { Message } from '@/types/chat';

export const useMessagePersistence = () => {
  const { toast } = useToast();
  const { session, refreshSession } = useSessionManagement();

  const saveMessageToSupabase = async (message: Message, chatId?: string) => {
    const startTime = performance.now();
    try {
      console.log('[useMessagePersistence] Saving message:', { 
        chatId,
        messageType: message.type,
        timestamp: new Date().toISOString()
      });

      // Ensure we have a valid session
      let currentSession = session;
      if (!currentSession) {
        console.log('[useMessagePersistence] No session found, attempting refresh');
        currentSession = await refreshSession();
        if (!currentSession) {
          throw new Error('Authentication required');
        }
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('[useMessagePersistence] User fetch error:', userError);
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
          console.error('[useMessagePersistence] Chat creation error:', chatError);
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
        console.error('[useMessagePersistence] Message save error:', messageError);
        throw messageError;
      }
      
      const endTime = performance.now();
      console.log('[useMessagePersistence] Message saved successfully:', {
        chatId,
        messageId: messageData.id,
        duration: `${(endTime - startTime).toFixed(2)}ms`
      });
      
      return { chatId, messageId: messageData.id };
    } catch (error: any) {
      console.error('[useMessagePersistence] Error saving message:', error);
      throw error;
    }
  };

  const loadChatMessages = async (chatId: string) => {
    const startTime = performance.now();
    try {
      console.log('[useMessagePersistence] Loading messages for chat:', chatId);
      
      // Ensure we have a valid session before proceeding
      let currentSession = session;
      if (!currentSession) {
        console.log('[useMessagePersistence] No session found, attempting refresh');
        currentSession = await refreshSession();
        if (!currentSession) {
          throw new Error('Authentication required');
        }
      }

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[useMessagePersistence] Messages fetch error:', messagesError);
        throw messagesError;
      }

      const messageIds = messages?.map(m => m.id) || [];
      
      if (messageIds.length === 0) {
        const endTime = performance.now();
        console.log('[useMessagePersistence] No messages found:', {
          chatId,
          duration: `${(endTime - startTime).toFixed(2)}ms`
        });
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

      const endTime = performance.now();
      console.log('[useMessagePersistence] Successfully loaded messages:', {
        count: messages?.length || 0,
        chatId,
        duration: `${(endTime - startTime).toFixed(2)}ms`
      });

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