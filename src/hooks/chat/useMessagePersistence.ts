import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import type { Message } from '@/types/chat';

interface ActiveOperation {
  controller: AbortController;
  cleanup?: () => void;
}

export const useMessagePersistence = () => {
  const { toast } = useToast();
  const { status } = useSession();
  const operationQueueRef = useRef<Map<string, ActiveOperation>>(new Map());
  const activeListenersRef = useRef<Set<() => void>>(new Set());
  const isUnmountingRef = useRef(false);

  // Cleanup helper to ensure consistent resource release
  const cleanupOperation = useCallback((chatId: string) => {
    console.log('[useMessagePersistence] Cleaning up operation for chat:', chatId);
    
    const operation = operationQueueRef.current.get(chatId);
    if (operation) {
      try {
        operation.controller.abort();
        if (operation.cleanup) {
          operation.cleanup();
        }
        operationQueueRef.current.delete(chatId);
        console.log('[useMessagePersistence] Successfully cleaned up operation for chat:', chatId);
      } catch (error) {
        console.error('[useMessagePersistence] Error during operation cleanup:', error);
      }
    }
  }, []);

  const clearQueuedOperations = useCallback((chatId?: string) => {
    console.log('[useMessagePersistence] Clearing operations', 
      chatId ? `for chat: ${chatId}` : 'for all chats'
    );

    if (chatId) {
      cleanupOperation(chatId);
    } else {
      const chatIds = Array.from(operationQueueRef.current.keys());
      chatIds.forEach(id => cleanupOperation(id));
      operationQueueRef.current.clear();
    }

    // Log cleanup state
    console.log('[useMessagePersistence] Operation queue state after cleanup:', {
      pendingOperations: operationQueueRef.current.size,
      activeListeners: activeListenersRef.current.size
    });
  }, [cleanupOperation]);

  // Register cleanup function for event listeners
  const registerCleanup = useCallback((cleanup: () => void) => {
    activeListenersRef.current.add(cleanup);
    return () => {
      activeListenersRef.current.delete(cleanup);
    };
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
        clearQueuedOperations(); // Clear operations on auth error
        throw new Error('You must be logged in to send messages');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('[useMessagePersistence] User fetch error:', userError);
        clearQueuedOperations(); // Clear operations on user fetch error
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
          clearQueuedOperations(); // Clear operations on chat creation error
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
        clearQueuedOperations(); // Clear operations on message save error
        throw messageError;
      }
      
      console.log('[useMessagePersistence] Message saved successfully:', messageData.id);
      return { chatId, messageId: messageData.id };
    } catch (error: any) {
      console.error('[useMessagePersistence] Error saving message:', error);
      clearQueuedOperations(); // Clear operations on error
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
    const operation: ActiveOperation = { controller };
    operationQueueRef.current.set(chatId, operation);

    try {
      console.log('[useMessagePersistence] Loading messages for chat:', chatId);
      
      const messagesPromise = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .abortSignal(controller.signal);

      // Set up real-time subscription for updates
      const subscription = supabase
        .channel(`messages:${chatId}`)
        .on('*', () => {
          if (!isUnmountingRef.current) {
            console.log('[useMessagePersistence] Message update received for chat:', chatId);
          }
        })
        .subscribe();

      // Register cleanup for subscription
      operation.cleanup = () => {
        subscription.unsubscribe();
        console.log('[useMessagePersistence] Unsubscribed from messages channel:', chatId);
      };

      const { data: messages, error: messagesError } = await messagesPromise;

      if (messagesError) {
        console.error('[useMessagePersistence] Messages fetch error:', messagesError);
        throw messagesError;
      }

      const messageIds = messages?.map(m => m.id) || [];
      
      if (messageIds.length === 0) {
        return [];
      }

      const { data: editedMessages, error: editsError } = await supabase
        .from('edited_messages')
        .select('*', { count: 'exact' })
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
      if (operationQueueRef.current.get(chatId) === operation) {
        cleanupOperation(chatId);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      console.log('[useMessagePersistence] Component unmounting, cleaning up resources');
      
      // Log state before cleanup
      console.log('[useMessagePersistence] State before cleanup:', {
        pendingOperations: operationQueueRef.current.size,
        activeListeners: activeListenersRef.current.size
      });

      // Clear all operations
      clearQueuedOperations();

      // Clear all registered listeners
      activeListenersRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('[useMessagePersistence] Error during listener cleanup:', error);
        }
      });
      activeListenersRef.current.clear();

      // Log final state
      console.log('[useMessagePersistence] Final cleanup state:', {
        pendingOperations: operationQueueRef.current.size,
        activeListeners: activeListenersRef.current.size
      });
    };
  }, [clearQueuedOperations]);

  return {
    saveMessageToSupabase,
    loadChatMessages,
    clearQueuedOperations,
    registerCleanup
  };
};
