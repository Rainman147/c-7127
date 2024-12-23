import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessageLoader = (
  loadMessages: (chatId: string, updateCache: (chatId: string, messages: Message[]) => void) => Promise<Message[]>,
  getCachedMessages: (chatId: string) => Message[] | null,
  updateCache: (chatId: string, messages: Message[]) => void
) => {
  const { toast } = useToast();

  const handleMessagesLoad = useCallback(async (
    sessionId: string,
    updateMessages: (messages: Message[]) => void
  ) => {
    console.log('[useMessageLoader] Loading messages for session:', sessionId);
    
    try {
      const cachedMessages = getCachedMessages(sessionId);
      if (cachedMessages) {
        console.log('[useMessageLoader] Using cached messages');
        updateMessages(cachedMessages);
        return true;
      }

      console.log('[useMessageLoader] Fetching messages from database');
      const loadedMessages = await loadMessages(sessionId, updateCache);
      updateMessages(loadedMessages);
      return true;
    } catch (error) {
      console.error('[useMessageLoader] Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
      return false;
    }
  }, [loadMessages, getCachedMessages, updateCache, toast]);

  return {
    handleMessagesLoad
  };
};