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

// Type guard to check if an object is a valid DatabaseMessage
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
        (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
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
                timestamp: newData.created_at // Changed from timestamp to created_at
              };
              
              console.log('[useRealtimeMessages] Processing new message:', {
                id: newMessage.id,
                sequence: newMessage.sequence,
                timestamp: newMessage.timestamp
              });

              const updatedMessages = validateAndMergeMessages(messages, newMessage);
              setMessages(updatedMessages);
              updateCache(currentChatId, updatedMessages);
              
            } else if (payload.eventType === 'UPDATE') {
              console.log('[useRealtimeMessages] Processing message update:', newData.id);
              
              const updatedMessages = messages.map(msg => 
                msg.id === newData.id ? {
                  ...msg,
                  content: newData.content,
                  type: newData.type as 'text' | 'audio',
                  sequence: newData.sequence || msg.sequence,
                  timestamp: newData.created_at // Changed from timestamp to created_at
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