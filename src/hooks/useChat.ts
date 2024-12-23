import { useCallback } from 'react';
import { useMessageState } from './chat/useMessageState';
import { useMessageLoader } from './chat/useMessageLoader';
import { useMessageSender } from './chat/useMessageSender';
import { useMessageHandling } from './chat/useMessageHandling';
import { useChatCache } from './chat/useChatCache';
import { useRealtimeMessages } from './chat/useRealtimeMessages';
import { useMessageLoading } from './chat/useMessageLoading';
import { useSessionCoordinator } from './chat/useSessionCoordinator';
import type { Message } from '@/types/chat';

export const useChat = (activeSessionId: string | null) => {
  const { messages, updateMessages, clearMessages, setMessages } = useMessageState();
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { getCachedMessages, updateCache, invalidateCache } = useChatCache();
  const { loadMessages, loadMoreMessages, isLoadingMore } = useMessageLoading();
  const { ensureSession } = useSessionCoordinator();

  const { handleMessagesLoad } = useMessageLoader(loadMessages, getCachedMessages, updateCache);
  const { handleSendMessage: messageSender } = useMessageSender(sendMessage, updateCache);

  // Set up real-time message updates
  useRealtimeMessages(
    activeSessionId,
    messages,
    setMessages,
    updateCache,
    invalidateCache
  );

  // Handle session changes
  useEffect(() => {
    console.log('[useChat] Active session changed:', activeSessionId);
    
    if (!activeSessionId) {
      console.log('[useChat] No active session, clearing messages');
      clearMessages();
      return;
    }

    handleMessagesLoad(activeSessionId, updateMessages);
  }, [activeSessionId, handleMessagesLoad, clearMessages, updateMessages]);

  const handleSendMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type });
    
    const currentSessionId = activeSessionId || await ensureSession();
    if (!currentSessionId) {
      throw new Error('Failed to create or get chat session');
    }

    return messageSender(
      content,
      currentSessionId,
      messages,
      updateMessages,
      type,
      systemInstructions
    );
  }, [activeSessionId, ensureSession, messages, messageSender, updateMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadMoreMessages: useCallback(() => 
      loadMoreMessages(activeSessionId, messages, setMessages, updateCache),
      [activeSessionId, messages, loadMoreMessages, updateCache, setMessages]
    ),
    setMessages
  };
};

export default useChat;