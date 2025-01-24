import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message, MessageType } from '@/types/chat';

const MESSAGES_PER_PAGE = 50;

interface MessageError {
  code: string;
  message: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<MessageError | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const { toast } = useToast();

  const clearMessages = useCallback(() => {
    console.log('[useChat] Clearing messages');
    setMessages([]);
    setMessageError(null);
    setPage(1);
    setHasMore(true);
  }, []);

  const handleSendMessage = useCallback(async (
    content: string,
    type: MessageType = 'text'
  ) => {
    console.log('[useChat] Sending message:', { content, type, currentChatId });
    setIsLoading(true);
    setMessageError(null);

    try {
      // Save user message first
      const { data: userMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          chat_id: currentChatId,
          role: 'user',
          content,
          type,
          status: 'delivered'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Process with Gemini function
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          chatId: currentChatId,
          messageId: userMessage.id,
          content
        }
      });

      if (error) throw error;

      if (data?.chatId && !currentChatId) {
        console.log('[useChat] Setting new chat ID:', data.chatId);
        setCurrentChatId(data.chatId);
      }

      // Load latest messages after processing
      const { data: messages, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChatId || data.chatId)
        .order('created_at', { ascending: true });

      if (loadError) throw loadError;

      if (messages) {
        console.log('[useChat] Received messages:', messages.length);
        setMessages(messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          type: msg.type || 'text',
          status: msg.status || 'delivered',
          created_at: msg.created_at
        })));
      }

    } catch (error: any) {
      console.error('[useChat] Error:', error);
      setMessageError({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'Failed to send message'
      });
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, toast]);

  const loadInitialMessages = useCallback(async (chatId: string) => {
    console.log('[useChat] Loading initial messages for chat:', chatId);
    setIsLoading(true);
    setCurrentChatId(chatId);
    setMessageError(null);
    setPage(1);

    try {
      const { data: messages, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .range(0, MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      if (messages) {
        console.log('[useChat] Loaded initial messages:', messages.length);
        setMessages(messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          type: msg.type || 'text',
          status: msg.status || 'delivered',
          created_at: msg.created_at
        })));
        setHasMore(count ? count > MESSAGES_PER_PAGE : false);
      }
    } catch (error: any) {
      console.error('[useChat] Error loading messages:', error);
      setMessageError({
        code: error.code || 'LOAD_ERROR',
        message: error.message || 'Failed to load chat messages'
      });
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentChatId || !hasMore || isLoading) return;
    
    console.log('[useChat] Loading more messages, page:', page + 1);
    setIsLoading(true);

    try {
      const start = page * MESSAGES_PER_PAGE;
      const end = start + MESSAGES_PER_PAGE - 1;

      const { data: newMessages, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true })
        .range(start, end);

      if (error) throw error;

      if (newMessages) {
        console.log('[useChat] Loaded additional messages:', newMessages.length);
        setMessages(prevMessages => [
          ...prevMessages,
          ...newMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            type: msg.type || 'text',
            status: msg.status || 'delivered',
            created_at: msg.created_at
          }))
        ]);
        setPage(p => p + 1);
        setHasMore(count ? count > (end + 1) : false);
      }
    } catch (error: any) {
      console.error('[useChat] Error loading more messages:', error);
      toast({
        title: "Error",
        description: "Failed to load more messages.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, hasMore, isLoading, page, toast]);

  return {
    messages,
    isLoading,
    messageError,
    currentChatId,
    hasMore,
    handleSendMessage,
    loadInitialMessages,
    loadMoreMessages,
    clearMessages
  };
};