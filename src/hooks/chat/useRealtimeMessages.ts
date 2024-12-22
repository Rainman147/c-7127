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
    timestamp: newMessage.timestamp
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
    return new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime();
  });

  console.log('[useRealtimeMessages] Messages sorted:', {
    messageCount: updatedMessages.length,
    sequences: updatedMessages.map(m => m.sequence)
  });

  return updatedMessages;
};

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
        async (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
          console.log('[useRealtimeMessages] Received update:', {
            event: payload.eventType,
            messageId: payload.new?.id,
            sequence: payload.new?.sequence
          });
          
          try {
            if (payload.eventType === 'INSERT' && payload.new) {
              const dbMessage = payload.new;
              
              const newMessage: Message = {
                role: dbMessage.sender as 'user' | 'assistant',
                content: dbMessage.content,
                type: dbMessage.type as 'text' | 'audio',
                id: dbMessage.id,
                sequence: dbMessage.sequence || messages.length + 1,
                timestamp: dbMessage.timestamp || dbMessage.created_at
              };
              
              console.log('[useRealtimeMessages] Processing new message:', {
                id: newMessage.id,
                sequence: newMessage.sequence,
                timestamp: newMessage.timestamp
              });

              const updatedMessages = validateAndMergeMessages(messages, newMessage);
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
              
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const dbMessage = payload.new;
              console.log('[useRealtimeMessages] Processing message update:', dbMessage.id);
              
              const updatedMessages = messages.map(msg => 
                msg.id === dbMessage.id ? {
                  ...msg,
                  content: dbMessage.content,
                  type: dbMessage.type as 'text' | 'audio'
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
      .subscribe();

    return () => {
      console.log('[useRealtimeMessages] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [currentChatId, messages, setMessages, updateCache, toast]);
};