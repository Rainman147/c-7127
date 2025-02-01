import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mapDatabaseMessage } from '@/utils/chat/messageMapping';
import { MESSAGES_PER_PAGE } from './constants';
import type { MessageType } from '@/types/chat';

interface StreamMetadata {
  type: 'metadata';
  chatId: string;
}

interface StreamChunk {
  type: 'chunk';
  content: string;
}

interface StreamError {
  type: 'error';
  error: string;
  code?: string;
}

type StreamMessage = StreamMetadata | StreamChunk | StreamError;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useMessageOperations = () => {
  const { toast } = useToast();

  const handleStreamMessage = async (
    data: StreamMessage,
    activeChatId: string | null,
    setMessages: (messages: any[]) => void,
    setMessageError: (error: any) => void
  ) => {
    console.log('[DEBUG][useMessageOperations] Stream message received:', {
      type: data.type,
      chatId: 'chatId' in data ? data.chatId : undefined,
      hasContent: 'content' in data ? !!data.content : false,
      time: new Date().toISOString()
    });

    if (data.type === 'error') {
      setMessageError({
        code: data.code || 'STREAM_ERROR',
        message: data.error
      });
      return;
    }

    if (data.type === 'metadata' && data.chatId) {
      activeChatId = data.chatId;
      return;
    }

    if (data.type === 'chunk' && activeChatId && data.content) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });

      if (messages) {
        setMessages(messages.map(mapDatabaseMessage));
      }
    }
  };

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
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('[DEBUG][useMessageOperations] No auth session found');
      setMessageError({
        code: 'AUTH_ERROR',
        message: 'No authentication session found'
      });
      return;
    }
    
    setIsLoading(true);
    setMessageError(null);

    try {
      // Initialize streaming connection with Gemini
      const { data: { streamUrl }, error: initError } = await supabase.functions.invoke('gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { 
          chatId: currentChatId,
          content,
          action: 'init'
        }
      });

      if (initError) throw initError;
      if (!streamUrl) throw new Error('No stream URL received');

      console.log('[DEBUG][useMessageOperations] Stream URL received:', streamUrl);
      let activeChatId = currentChatId;

      // Set up EventSource for streaming
      const eventSource = new EventSource(streamUrl);
      
      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data) as StreamMessage;
          await handleStreamMessage(data, activeChatId, setMessages, setMessageError);
        } catch (e) {
          console.error('[DEBUG][useMessageOperations] Stream parse error:', {
            error: e,
            data: event.data,
            time: new Date().toISOString()
          });
        }
      };

      eventSource.onerror = async (error) => {
        console.error('[DEBUG][useMessageOperations] Stream error:', {
          error,
          time: new Date().toISOString()
        });

        eventSource.close();
        setIsLoading(false);
        setMessageError({
          code: 'STREAM_ERROR',
          message: 'Connection lost. Please try again.'
        });
        
        toast({
          title: "Connection Error",
          description: "Failed to maintain connection. Please try again.",
          variant: "destructive",
        });
      };

      // Cleanup function
      return () => {
        console.log('[DEBUG][useMessageOperations] Cleaning up EventSource');
        eventSource.close();
      };

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
      });
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
