import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mapDatabaseMessage } from '@/utils/chat/messageMapping';
import { MESSAGES_PER_PAGE } from './constants';
import type { MessageType } from '@/types/chat';
import type { Template } from '@/types/template';
import type { PatientContext } from '@/types';

const handleStreamMessage = async (
  data: any,
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
    console.error('[DEBUG][useMessageOperations] Stream error:', {
      code: data.code,
      error: data.error,
      time: new Date().toISOString()
    });
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

export const useMessageOperations = () => {
  const { toast } = useToast();
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const handleSendMessage = async (
    content: string,
    type: MessageType = 'text',
    currentChatId: string | null,
    setMessages: (messages: any[]) => void,
    setIsLoading: (loading: boolean) => void,
    setMessageError: (error: any) => void,
    template?: Template | null,
    patientContext?: PatientContext | null
  ) => {
    console.log('[DEBUG][useMessageOperations] Starting send:', { 
      contentLength: content.length,
      type,
      currentChatId,
      hasTemplate: !!template,
      hasPatientContext: !!patientContext,
      time: new Date().toISOString()
    });

    setIsLoading(true);
    setMessageError(null);

    try {
      // Initial request to set up chat and get stream URL
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { content, type }
      });

      if (error) throw error;
      if (!data?.streamUrl) throw new Error('No stream URL returned');

      // Add debug parameter to stream URL
      const streamUrl = new URL(data.streamUrl);
      streamUrl.searchParams.append('debug', 'true');

      console.log('[DEBUG][useMessageOperations] Stream URL received:', {
        url: streamUrl.toString(),
        time: new Date().toISOString()
      });

      // Connect to stream
      const eventSource = new EventSource(streamUrl.toString());
      
      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await handleStreamMessage(data, currentChatId, setMessages, setMessageError);
        } catch (e) {
          console.error('[DEBUG][useMessageOperations] Stream parse error:', e);
        }
      };

      eventSource.onerror = async (error) => {
        console.error('[DEBUG][useMessageOperations] Stream error:', {
          error,
          retryCount,
          time: new Date().toISOString()
        });

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`[DEBUG][useMessageOperations] Retrying connection (${retryCount}/${MAX_RETRIES})`);
          
          toast({
            title: "Connection lost",
            description: `Attempting to reconnect... (${retryCount}/${MAX_RETRIES})`,
            duration: 3000,
          });

          // Close current connection
          eventSource.close();
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          // Retry the entire send operation
          return handleSendMessage(
            content,
            type,
            currentChatId,
            setMessages,
            setIsLoading,
            setMessageError,
            template,
            patientContext
          );
        }

        eventSource.close();
        setIsLoading(false);
        setMessageError({
          code: 'STREAM_ERROR',
          message: 'Failed to maintain connection after multiple attempts.'
        });
        
        toast({
          title: "Connection Error",
          description: "Failed to maintain connection. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      };

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
        duration: 5000,
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