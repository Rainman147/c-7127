import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import { useCleanupManager } from './cleanup/useCleanupManager';

export const useMessagePersistence = () => {
  const { toast } = useToast();
  const { registerCleanup, clearQueuedOperations } = useCleanupManager();

  const saveMessage = async (message: Message, chatId?: string) => {
    try {
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
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const loadChatMessages = useCallback(async (chatId: string) => {
    console.log('[useMessagePersistence] Loading messages for chat:', chatId);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive"
        });
        throw new Error('Authentication required');
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
  }, [toast]);

  return {
    saveMessage,
    loadChatMessages,
    clearQueuedOperations,
    registerCleanup
  };
};