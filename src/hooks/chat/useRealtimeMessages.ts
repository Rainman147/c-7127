import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { logger, LogCategory } from '@/utils/logging';

const validateAndMergeMessages = (localMessages: Message[], newMessage: Message): Message[] => {
  logger.merge('validateAndMergeMessages', 'Starting merge operation:', {
    localMessageCount: localMessages.length,
    newMessageId: newMessage.id,
    localMessageIds: localMessages.map(m => m.id)
  });

  const isDuplicate = localMessages.some(msg => msg.id === newMessage.id);
  if (isDuplicate) {
    logger.debug(LogCategory.MERGE, 'validateAndMergeMessages', 'Duplicate message detected:', {
      messageId: newMessage.id
    });
    return localMessages;
  }

  const nonOptimisticMessages = localMessages.filter(msg => !msg.isOptimistic);
  const mergedMessages = [...nonOptimisticMessages, {
    ...newMessage,
    chat_id: newMessage.chat_id
  }].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });

  logger.merge('validateAndMergeMessages', 'Merge complete:', {
    originalCount: localMessages.length,
    mergedCount: mergedMessages.length,
    addedMessageId: newMessage.id,
    messageOrder: mergedMessages.map(m => ({
      id: m.id,
      sequence: m.sequence,
      created_at: m.created_at
    }))
  });

  return mergedMessages;
};

export const useRealtimeMessages = (
  currentChatId: string | null,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  updateCache: (chatId: string, messages: Message[]) => void,
  invalidateCache: (chatId: string) => void
) => {
  const { toast } = useToast();
  const prevChatIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscriptionTimeoutRef = useRef<number>();

  const cleanupSubscription = useCallback(() => {
    if (channelRef.current) {
      logger.info(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'Cleaning up subscription:', {
        chatId: prevChatIdRef.current,
        timestamp: new Date().toISOString()
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (subscriptionTimeoutRef.current) {
      clearTimeout(subscriptionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!currentChatId || currentChatId === prevChatIdRef.current) {
      return;
    }

    cleanupSubscription();
    prevChatIdRef.current = currentChatId;

    logger.info(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'Setting up subscription:', {
      chatId: currentChatId,
      timestamp: new Date().toISOString()
    });
    
    const channel = supabase
      .channel(`chat-${currentChatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
          const newData = payload.new as DatabaseMessage;
          
          try {
            if (payload.eventType === 'INSERT' && newData) {
              const newMessage: Message = {
                role: newData.sender === 'user' ? 'user' : 'assistant',
                content: newData.content,
                type: newData.type as 'text' | 'audio',
                id: newData.id,
                chat_id: newData.chat_id,
                sequence: newData.sequence || messages.length + 1,
                created_at: newData.created_at,
                status: newData.status as Message['status']
              };

              logger.debug(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'Received new message:', {
                messageId: newMessage.id,
                chatId: currentChatId
              });

              const updatedMessages = validateAndMergeMessages([...messages], newMessage);
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
              
            } else if (payload.eventType === 'UPDATE' && newData) {
              logger.debug(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'Received message update:', {
                messageId: newData.id,
                chatId: currentChatId
              });

              invalidateCache(currentChatId);
              
              const updatedMessages = messages.map(msg => 
                msg.id === newData.id ? {
                  ...msg,
                  content: newData.content,
                  type: newData.type as 'text' | 'audio',
                  sequence: newData.sequence || msg.sequence,
                  created_at: newData.created_at,
                  chat_id: newData.chat_id,
                  status: newData.status as Message['status']
                } : msg
              );
              setMessages(updatedMessages);
            }
          } catch (error) {
            logger.error(LogCategory.ERROR, 'useRealtimeMessages', 'Error handling update:', {
              error,
              payload,
              chatId: currentChatId
            });
            toast({
              title: "Error",
              description: "Failed to process message update",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          logger.info(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'Successfully subscribed:', {
            chatId: currentChatId
          });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error(LogCategory.ERROR, 'useRealtimeMessages', 'Subscription error:', {
            chatId: currentChatId
          });
          toast({
            title: "Connection Error",
            description: "Failed to connect to chat updates",
            variant: "destructive"
          });
        }
      });

    channelRef.current = channel;

    subscriptionTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        logger.warn(LogCategory.COMMUNICATION, 'useRealtimeMessages', 'Subscription timeout:', {
          chatId: currentChatId
        });
        cleanupSubscription();
        toast({
          title: "Connection Timeout",
          description: "Reconnecting to chat updates...",
          variant: "destructive"
        });
      }
    }, 30000) as unknown as number;

    return cleanupSubscription;
  }, [currentChatId, messages, setMessages, updateCache, invalidateCache, toast, cleanupSubscription]);
};