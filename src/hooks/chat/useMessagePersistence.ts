import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMessageOperations } from './operations/useMessageOperations';
import { useMessageSubscriptions } from './subscriptions/useMessageSubscriptions';
import { useCleanupManager } from './cleanup/useCleanupManager';
import type { Message } from '@/types/chat';

interface DatabaseMessage {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
  sequence: number;
  status: string;
  delivered_at: string;
  seen_at: string;
}

interface MessagesResponse {
  messages: Message[];
  count: number;
}

const mapDatabaseMessageToMessage = (dbMessage: DatabaseMessage): Message => ({
  id: dbMessage.id,
  role: dbMessage.sender === 'user' ? 'user' : 'assistant',
  content: dbMessage.content,
  type: dbMessage.type as 'text' | 'audio',
  isStreaming: dbMessage.status === 'streaming'
});

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

  const loadChatMessages = useCallback(async (chatId: string): Promise<MessagesResponse> => {
    console.log('[useMessagePersistence] Loading messages for chat:', chatId);

    // Cancel any existing operations for this chat with reason
    cleanup.clearQueuedOperations(chatId, 'New chat load requested');

    // Create new abort controller for this operation
    const controller = new AbortController();
    const operation = { 
      controller,
      cleanup: undefined as (() => void) | undefined,
      startTime: Date.now()
    };
    cleanup.operationQueueRef.current.set(chatId, operation);

    try {
      const { messages: dbMessages } = await loadMessages(chatId, controller.signal);
      
      // Set up real-time subscription
      const { subscribe } = useMessageSubscriptions(chatId);
      const unsubscribe = subscribe(() => {
        console.log('[useMessagePersistence] Message update received, reloading messages');
        // Pass abort reason for existing operation
        cleanup.clearQueuedOperations(chatId, 'Real-time update triggered');
        loadMessages(chatId, controller.signal);
      });

      // Register cleanup for subscription
      operation.cleanup = unsubscribe;

      // Convert database messages to Message type
      const messages = (dbMessages as DatabaseMessage[]).map(mapDatabaseMessageToMessage);

      const duration = Date.now() - operation.startTime;
      console.log(`[useMessagePersistence] Successfully loaded ${messages.length} messages in ${duration}ms`);

      return { messages, count: messages.length };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[useMessagePersistence] Operation cancelled for chat:', chatId, 'Reason:', error.message);
        return { messages: [], count: 0 };
      }
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