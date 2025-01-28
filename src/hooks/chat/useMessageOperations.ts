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
    console.log('[useMessageOperations] Starting message send:', { 
      contentLength: content.length,
      type,
      currentChatId,
      authSession: await supabase.auth.getSession()
    });
    
    setIsLoading(true);
    setMessageError(null);

    try {
      console.log('[useMessageOperations] Invoking Gemini function');
      const response = await supabase.functions.invoke('gemini', {
        body: { 
          chatId: currentChatId,
          content
        }
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      const reader = new ReadableStreamDefaultReader(response.data);
      let activeChatId = currentChatId;
      let receivedMetadata = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5)) as StreamMessage;
              
              if (data.type === 'metadata') {
                console.log('[useMessageOperations] Received metadata:', data);
                activeChatId = data.chatId;
                receivedMetadata = true;
              } else if (data.type === 'chunk') {
                console.log('[useMessageOperations] Received chunk');
                // Handle content chunk - we'll get the full message at the end
              }
            } catch (e) {
              console.error('[useMessageOperations] Error parsing chunk:', e);
            }
          }
        }
      }

      if (!receivedMetadata) {
        throw new Error('No metadata received from stream');
      }

      if (!activeChatId) {
        throw new Error('No chat ID available');
      }

      const { data: messages, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });

      if (loadError) {
        console.error('[useMessageOperations] Error loading messages:', loadError);
        throw loadError;
      }

      if (messages) {
        console.log('[useMessageOperations] Loaded messages:', messages.length);
        setMessages(messages.map(mapDatabaseMessage));
      }

    } catch (error: any) {
      console.error('[useMessageOperations] Operation failed:', error);
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