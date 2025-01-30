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

type StreamMessage = StreamMetadata | StreamChunk;

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
      authStatus: 'checking...'
    });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('[DEBUG][useMessageOperations] Auth check complete:', {
      hasAuthSession: !!session,
      userId: session?.user?.id,
      sessionExpiry: session?.expires_at
    });

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
      console.log('[DEBUG][useMessageOperations] Invoking Gemini:', {
        currentChatId,
        contentPreview: content.substring(0, 50),
        requestTime: new Date().toISOString()
      });
      
      const response = await supabase.functions.invoke('gemini', {
        body: { 
          chatId: currentChatId,
          content
        }
      });

      console.log('[DEBUG][useMessageOperations] Gemini response received:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        error: response.error,
        responseTime: new Date().toISOString(),
        status: response.status
      });

      if (response.error) {
        console.error('[DEBUG][useMessageOperations] Gemini function error:', {
          error: response.error,
          status: response.status,
          message: response.error.message,
          details: response.error.details || 'No additional details'
        });
        throw response.error;
      }

      if (!response.data) {
        console.error('[DEBUG][useMessageOperations] No response data received');
        throw new Error('No response data received');
      }

      const reader = new ReadableStreamDefaultReader(response.data);
      let activeChatId = currentChatId;
      let receivedMetadata = false;

      console.log('[DEBUG][useMessageOperations] Starting stream processing');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[DEBUG][useMessageOperations] Stream complete');
          break;
        }

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5)) as StreamMessage;
              
              if (data.type === 'metadata') {
                console.log('[DEBUG][useMessageOperations] Stream metadata:', {
                  chatId: data.chatId,
                  currentChatId,
                  time: new Date().toISOString()
                });
                activeChatId = data.chatId;
                receivedMetadata = true;
              } else if (data.type === 'chunk') {
                console.log('[DEBUG][useMessageOperations] Received chunk');
              }
            } catch (e) {
              console.error('[DEBUG][useMessageOperations] Chunk parse error:', {
                error: e,
                line,
                time: new Date().toISOString()
              });
            }
          }
        }
      }

      console.log('[DEBUG][useMessageOperations] Stream processing complete:', {
        receivedMetadata,
        activeChatId,
        time: new Date().toISOString()
      });

      if (!receivedMetadata) {
        console.error('[DEBUG][useMessageOperations] No metadata in stream');
        throw new Error('No metadata received from stream');
      }

      if (!activeChatId) {
        console.error('[DEBUG][useMessageOperations] No chat ID available');
        throw new Error('No chat ID available');
      }

      const { data: messages, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });

      console.log('[DEBUG][useMessageOperations] Final messages load:', {
        success: !loadError,
        messageCount: messages?.length,
        chatId: activeChatId,
        time: new Date().toISOString()
      });

      if (loadError) {
        console.error('[DEBUG][useMessageOperations] Load error:', {
          error: loadError,
          code: loadError.code,
          details: loadError.details,
          time: new Date().toISOString()
        });
        throw loadError;
      }

      if (messages) {
        setMessages(messages.map(mapDatabaseMessage));
      }

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