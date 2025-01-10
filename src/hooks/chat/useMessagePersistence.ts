import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import type { Message } from '@/types/chat';

export const useMessagePersistence = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const operationQueueRef = useRef<Map<string, AbortController>>(new Map());

  const clearQueuedOperations = useCallback((chatId?: string) => {
    console.log('[useMessagePersistence] Clearing operations', 
      chatId ? `for chat: ${chatId}` : 'for all chats'
    );

    if (chatId) {
      const controller = operationQueueRef.current.get(chatId);
      if (controller) {
        controller.abort();
        operationQueueRef.current.delete(chatId);
        console.log('[useMessagePersistence] Cancelled operations for chat:', chatId);
      }
    } else {
      operationQueueRef.current.forEach((controller, id) => {
        controller.abort();
        console.log('[useMessagePersistence] Cancelled operations for chat:', id);
      });
      operationQueueRef.current.clear();
    }
  }, []);

  const saveMessageToSupabase = async (message: Message, chatId?: string) => {
    if (status !== 'validated') {
      console.log('[useMessagePersistence] Waiting for session validation before saving message');
      return;
    }

    try {
      console.log('[useMessagePersistence] Saving message to Supabase for chat:', chatId);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('[useMessagePersistence] Authentication error:', sessionError);
        throw new Error('You must be logged in to send messages');
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
      
      console.log('[useMessagePersistence] Message saved successfully:', messageData.id);
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

    // Cancel any existing operations for this chat
    clearQueuedOperations(chatId);

    // Create new abort controller for this operation
    const controller = new AbortController();
    operationQueueRef.current.set(chatId, controller);

    try {
      console.log('[useMessagePersistence] Loading messages for chat:', chatId);
      
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .abortSignal(controller.signal);

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
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

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

      const formattedMessages = (messages || []).map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: editedContentMap[msg.id] || msg.content,
        type: msg.type as 'text' | 'audio',
        id: msg.id
      }));

      console.log('[useMessagePersistence] Messages processed and ready:', formattedMessages.length);
      return formattedMessages;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useMessagePersistence] Operation cancelled for chat:', chatId);
        return [];
      }
      
      console.error('[useMessagePersistence] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load chat messages",
        variant: "destructive"
      });
      throw error;
    } finally {
      // Clean up the controller if it hasn't been replaced
      if (operationQueueRef.current.get(chatId) === controller) {
        operationQueueRef.current.delete(chatId);
        console.log('[useMessagePersistence] Cleaned up operation for chat:', chatId);
      }
    }
  };

  return {
    saveMessageToSupabase,
    loadChatMessages,
    clearQueuedOperations
  };
};