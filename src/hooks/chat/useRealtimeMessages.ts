import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const validateAndMergeMessages = (localMessages: Message[], newMessage: Message) => {
  console.log('[useRealtimeMessages] Validating new message:', { 
    messageId: newMessage.id,
    sequence: newMessage.sequence,
    created_at: newMessage.created_at
  });

  const isDuplicate = localMessages.some(msg => msg.id === newMessage.id);
  if (isDuplicate) {
    console.log('[useRealtimeMessages] Duplicate message detected:', newMessage.id);
    return localMessages;
  }

  const updatedMessages = [...localMessages, newMessage].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });

  console.log('[useRealtimeMessages] Messages sorted:', {
    messageCount: updatedMessages.length,
    sequences: updatedMessages.map(m => m.sequence)
  });

  return updatedMessages;
};

const isDatabaseMessage = (obj: any): obj is DatabaseMessage => {
  return obj && 
    typeof obj === 'object' && 
    'id' in obj && 
    typeof obj.id === 'string' &&
    'content' in obj && 
    typeof obj.content === 'string' &&
    'sender' in obj &&
    typeof obj.sender === 'string' &&
    'type' in obj &&
    typeof obj.type === 'string';
};

export const useRealtimeMessages = (
  currentChatId: string | null,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  updateCache: (chatId: string, messages: Message[]) => void,
  invalidateCache: (chatId: string) => void
) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!currentChatId) {
      console.log('[useRealtimeMessages] No chat ID provided, skipping subscription');
      return;
    }

    console.log('[useRealtimeMessages] Setting up subscription for chat:', currentChatId);
    
    let isSubscriptionActive = true;
    
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
          if (!isSubscriptionActive) {
            console.log('[useRealtimeMessages] Ignoring update for inactive subscription');
            return;
          }

          const newData = payload.new;
          
          console.log('[useRealtimeMessages] Received update:', {
            event: payload.eventType,
            messageId: isDatabaseMessage(newData) ? newData.id : undefined,
            sequence: isDatabaseMessage(newData) ? newData.sequence : undefined
          });
          
          try {
            if (!newData) {
              console.log('[useRealtimeMessages] No new data in payload');
              return;
            }

            if (!isDatabaseMessage(newData)) {
              console.error('[useRealtimeMessages] Invalid message data received');
              return;
            }

            if (payload.eventType === 'INSERT') {
              const newMessage: Message = {
                role: newData.sender as 'user' | 'assistant',
                content: newData.content,
                type: newData.type as 'text' | 'audio',
                id: newData.id,
                sequence: newData.sequence || messages.length + 1,
                created_at: newData.created_at
              };
              
              console.log('[useRealtimeMessages] Processing new message:', {
                id: newMessage.id,
                sequence: newMessage.sequence,
                created_at: newMessage.created_at
              });

              const updatedMessages = validateAndMergeMessages(messages, newMessage);
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
              
            } else if (payload.eventType === 'UPDATE') {
              console.log('[useRealtimeMessages] Processing message update:', newData.id);
              invalidateCache(currentChatId);
              
              const updatedMessages = messages.map(msg => 
                msg.id === newData.id ? {
                  ...msg,
                  content: newData.content,
                  type: newData.type as 'text' | 'audio',
                  sequence: newData.sequence || msg.sequence,
                  created_at: newData.created_at
                } : msg
              );
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
            }
          } catch (error) {
            console.error('[useRealtimeMessages] Error handling update:', error);
            toast({
              title: "Error",
              description: "Failed to process message update",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe(status => {
        console.log('[useRealtimeMessages] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeMessages] Successfully subscribed to chat:', currentChatId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeMessages] Error subscribing to chat:', currentChatId);
          toast({
            title: "Connection Error",
            description: "Failed to connect to chat updates",
            variant: "destructive"
          });
        }
      });

    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription for chat:', currentChatId);
      isSubscriptionActive = false;
      supabase.removeChannel(channel);
    };
  }, [currentChatId, messages, setMessages, updateCache, invalidateCache, toast]);
};