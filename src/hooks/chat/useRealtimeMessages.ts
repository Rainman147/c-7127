import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useRealtimeMessages = (
  currentChatId: string | null,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  updateCache: (chatId: string, messages: Message[]) => void,
  invalidateCache: (chatId: string) => void,
  onSubscriptionReady?: () => void
) => {
  const { toast } = useToast();
  const prevChatIdRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!currentChatId) {
      console.log('[useRealtimeMessages] No chat ID provided, skipping subscription');
      return;
    }

    if (currentChatId === prevChatIdRef.current) {
      console.log('[useRealtimeMessages] Chat ID unchanged, keeping existing subscription');
      return;
    }

    // Clean up previous subscription if it exists
    if (channelRef.current) {
      console.log('[useRealtimeMessages] Cleaning up previous subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    prevChatIdRef.current = currentChatId;
    console.log('[useRealtimeMessages] Setting up subscription for chat:', currentChatId);
    
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
          console.log('[useRealtimeMessages] Received message update:', payload);
          
          if (!payload.new || !('id' in payload.new)) {
            console.log('[useRealtimeMessages] No new data in payload, skipping');
            return;
          }

          const newMessage: Message = {
            id: payload.new.id,
            role: payload.new.sender as 'user' | 'assistant',
            content: payload.new.content,
            type: payload.new.type as 'text' | 'audio',
            sequence: payload.new.sequence || messages.length + 1,
            created_at: payload.new.created_at
          };

          if (payload.eventType === 'INSERT') {
            console.log('[useRealtimeMessages] Handling INSERT event');
            setMessages([...messages, newMessage]);
            updateCache(currentChatId, [...messages, newMessage]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('[useRealtimeMessages] Handling UPDATE event');
            setMessages(messages.map(msg => msg.id === payload.new.id ? newMessage : msg));
            invalidateCache(currentChatId);
          }
        }
      )
      .subscribe(status => {
        console.log('[useRealtimeMessages] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeMessages] Successfully subscribed to chat:', currentChatId);
          onSubscriptionReady?.();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeMessages] Error subscribing to chat:', currentChatId);
          toast({
            title: "Connection Error",
            description: "Failed to connect to chat updates. Please refresh the page.",
            variant: "destructive"
          });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription for chat:', currentChatId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentChatId, messages, setMessages, updateCache, invalidateCache, toast, onSubscriptionReady]);
};