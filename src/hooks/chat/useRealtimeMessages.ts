import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useRealtimeMessages = (
  currentChatId: string | null,
  messages: Message[],
  setMessages: (messages: Message[]) => void,
  updateCache: (chatId: string, messages: Message[]) => void
) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!currentChatId) return;

    console.log('[useRealtimeMessages] Setting up subscription for chat:', currentChatId);
    
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        async (payload) => {
          console.log('[useRealtimeMessages] Received update:', payload);
          
          try {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              const updatedMessages = [...messages, newMessage];
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
            } else if (payload.eventType === 'UPDATE') {
              const updatedMessages = messages.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
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
      .subscribe();

    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [currentChatId, messages, setMessages, updateCache, toast]);
};