import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessageOperations = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const saveMessage = useCallback(async (message: Message, chatId?: string) => {
    console.log('[useMessageOperations] Saving message:', { message, chatId });
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('[useMessageOperations] Authentication error:', sessionError);
        throw new Error('You must be logged in to send messages');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('[useMessageOperations] User fetch error:', userError);
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
          console.error('[useMessageOperations] Chat creation error:', chatError);
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
        console.error('[useMessageOperations] Message save error:', messageError);
        throw messageError;
      }
      
      console.log('[useMessageOperations] Message saved successfully:', messageData.id);
      return { chatId, messageId: messageData.id };

    } catch (error: any) {
      console.error('[useMessageOperations] Error saving message:', error);
      throw error;
    }
  }, [toast]);

  const loadMessages = useCallback(async (chatId: string, signal?: AbortSignal) => {
    console.log('[useMessageOperations] Loading messages for chat:', chatId);
    setIsLoading(true);

    try {
      const messagesPromise = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (signal) {
        messagesPromise.abortSignal(signal);
      }

      const { data: messages, error: messagesError, count } = await messagesPromise;

      if (messagesError) {
        console.error('[useMessageOperations] Messages fetch error:', messagesError);
        throw messagesError;
      }

      console.log('[useMessageOperations] Successfully loaded messages:', messages?.length);
      return { messages, count };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useMessageOperations] Operation cancelled for chat:', chatId);
        return { messages: [], count: 0 };
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    saveMessage,
    loadMessages,
    isLoading
  };
};