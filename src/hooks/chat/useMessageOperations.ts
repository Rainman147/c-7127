import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mapDatabaseMessage } from '@/utils/chat/messageMapping';
import { MESSAGES_PER_PAGE } from './constants';
import type { MessageType } from '@/types/chat';

export const useMessageOperations = () => {
  const { toast } = useToast();

  const handleSendMessage = async (
    content: string,
    type: MessageType = 'text',
    currentChatId: string | null,
    setMessages: (messages: any[]) => void,
    setIsLoading: (loading: boolean) => void,
    setMessageError: (error: any) => void
  ) => {
    console.log('[DEBUG][useMessageOperations] Starting send:', { 
      contentLength: content.length,
      type,
      currentChatId,
      time: new Date().toISOString()
    });

    setIsLoading(true);
    setMessageError(null);

    try {
      // Call gemini function (not gemini-stream)
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          content, 
          type,
          chatId: currentChatId,
          debug: process.env.NODE_ENV === 'development'
        }
      });

      console.log('[DEBUG][useMessageOperations] Gemini function response:', {
        hasData: !!data,
        error,
        time: new Date().toISOString()
      });

      if (error) throw error;

      // Return new chat ID if one was created
      if (data.isNewChat) {
        return data.chatId;
      }

      // Fetch updated messages after response
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', data.chatId)
        .order('created_at', { ascending: true });

      if (messages) {
        setMessages(messages.map(mapDatabaseMessage));
      }

      return null;

    } catch (error: any) {
      console.error('[DEBUG][useMessageOperations] Operation failed:', {
        error,
        code: error.code,
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
      
      setMessageError({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'Failed to send message'
      });
      
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 5000,
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialMessages = async (
    chatId: string,
    setMessages: (messages: any[]) => void,
    setIsLoading: (loading: boolean) => void,
    setCurrentChatId: (chatId: string) => void,
    setMessageError: (error: any) => void,
    setPage: (page: number) => void,
    setHasMore: (hasMore: boolean) => void
  ) => {
    console.log('[useMessageOperations] Loading initial messages for chat:', chatId);
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
        console.log('[useMessageOperations] Loaded initial messages:', messages.length);
        setMessages(messages.map(mapDatabaseMessage));
        setHasMore(count ? count > MESSAGES_PER_PAGE : false);
      }
    } catch (error: any) {
      console.error('[useMessageOperations] Error loading messages:', error);
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
  };

  const clearMessages = (
    setMessages: (messages: any[]) => void,
    setMessageError: (error: any) => void,
    setPage: (page: number) => void,
    setHasMore: (hasMore: boolean) => void
  ) => {
    console.log('[useMessageOperations] Clearing messages');
    setMessages([]);
    setMessageError(null);
    setPage(1);
    setHasMore(true);
  };

  return {
    handleSendMessage,
    loadInitialMessages,
    clearMessages,
  };
};