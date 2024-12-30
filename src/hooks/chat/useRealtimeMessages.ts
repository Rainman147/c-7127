import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const validateAndMergeMessages = (localMessages: Message[], newMessage: Message): Message[] => {
  const isDuplicate = localMessages.some(msg => msg.id === newMessage.id);
  if (isDuplicate) {
    return localMessages;
  }

  return [...localMessages, {
    ...newMessage,
    chat_id: newMessage.chat_id
  }].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });
};

const isDatabaseMessage = (obj: any): obj is DatabaseMessage => {
  return obj && 
    typeof obj === 'object' && 
    'id' in obj && 
    'content' in obj && 
    'sender' in obj &&
    'type' in obj;
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

  useEffect(() => {
    if (!currentChatId || currentChatId === prevChatIdRef.current) {
      return;
    }

    prevChatIdRef.current = currentChatId;
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
            return;
          }

          const newData = payload.new;
          if (!newData || !isDatabaseMessage(newData)) {
            return;
          }

          try {
            if (payload.eventType === 'INSERT') {
              const newMessage: Message = {
                role: newData.sender as 'user' | 'assistant',
                content: newData.content,
                type: newData.type as 'text' | 'audio',
                id: newData.id,
                sequence: newData.sequence || messages.length + 1,
                created_at: newData.created_at
              };

              const updatedMessages = validateAndMergeMessages([...messages], newMessage);
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
              
            } else if (payload.eventType === 'UPDATE') {
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

    channelRef.current = channel;

    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription for chat:', currentChatId);
      isSubscriptionActive = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentChatId, messages, setMessages, updateCache, invalidateCache, toast]);
};