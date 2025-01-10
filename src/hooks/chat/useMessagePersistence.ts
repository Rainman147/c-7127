import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMessageOperations } from './operations/useMessageOperations';
import { useMessageSubscriptions } from './subscriptions/useMessageSubscriptions';
import { useCleanupManager } from './cleanup/useCleanupManager';
import type { Message } from '@/types/chat';

export const useMessagePersistence = () => {
  const { toast } = useToast();
  const { saveMessage, loadMessages } = useMessageOperations();
  const cleanup = useCleanupManager();

  const saveMessageToSupabase = async (message: Message, chatId?: string) => {
    console.log('[useMessagePersistence] Saving message to Supabase');
    try {
      return await saveMessage(message, chatId);
    } catch (error: any) {
      console.error('[useMessagePersistence] Error saving message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save message",
        variant: "destructive"
      });
      throw error;
    }
  };

  const loadChatMessages = useCallback(async (chatId: string) => {
    console.log('[useMessagePersistence] Loading messages for chat:', chatId);

    // Cancel any existing operations for this chat
    cleanup.clearQueuedOperations(chatId);

    // Create new abort controller for this operation
    const controller = new AbortController();
    const operation = { controller };
    cleanup.operationQueueRef.current.set(chatId, operation);

    try {
      const { messages } = await loadMessages(chatId, controller.signal);
      
      // Set up real-time subscription
      const { subscribe } = useMessageSubscriptions(chatId);
      const unsubscribe = subscribe(() => {
        console.log('[useMessagePersistence] Message update received, reloading messages');
        loadMessages(chatId, controller.signal);
      });

      // Register cleanup for subscription
      operation.cleanup = unsubscribe;

      return messages as Message[];
    } catch (error: any) {
      console.error('[useMessagePersistence] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive"
      });
      throw error;
    }
  }, [cleanup, loadMessages, toast]);

  return {
    saveMessageToSupabase,
    loadChatMessages,
    clearQueuedOperations: cleanup.clearQueuedOperations,
    registerCleanup: cleanup.registerCleanup
  };
};