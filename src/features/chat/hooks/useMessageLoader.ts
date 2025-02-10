
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types';
import { toFrontendMessage } from '@/utils/transforms';
import { sortMessages } from '../utils/messageSort';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseMessageLoaderProps {
  sessionId: string | undefined;
  isReady: boolean;
  loadAttempts: number;
  setLoadAttempts: (value: number | ((prev: number) => number)) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (value: boolean) => void;
}

export const MAX_LOAD_ATTEMPTS = 3;

export const useMessageLoader = ({
  sessionId,
  isReady,
  loadAttempts,
  setLoadAttempts,
  setMessages,
  setIsLoading
}: UseMessageLoaderProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionId || !isReady) {
      console.log('[MessageLoader] Not ready to load messages:', { sessionId, isReady });
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    const loadMessages = async () => {
      try {
        console.log('[MessageLoader] Loading messages for session:', sessionId);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', sessionId)
          .order('created_at');

        if (error) throw error;

        if (isSubscribed) {
          console.log('[MessageLoader] Messages loaded:', data?.length || 0);
          const frontendMessages = (data || []).map(toFrontendMessage);
          setMessages(sortMessages(frontendMessages));
          setLoadAttempts(0);
        }
      } catch (error) {
        console.error('[MessageLoader] Error loading messages:', error);
        if (loadAttempts < MAX_LOAD_ATTEMPTS) {
          console.log('[MessageLoader] Will retry message load. Attempt:', loadAttempts + 1);
          setTimeout(() => setLoadAttempts(prev => prev + 1), 1000);
        }
        toast({
          title: "Error loading messages",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    console.log('[MessageLoader] Setting up realtime subscription for chat:', sessionId);
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${sessionId}`
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          console.log('[MessageLoader] Message change received:', payload);
          if (payload.eventType === 'INSERT' && isSubscribed) {
            setMessages(prev => {
              const withoutOptimistic = prev.filter(m => 
                m.metadata?.tempId !== payload.new.metadata?.tempId || 
                !m.metadata?.isOptimistic
              );
              return sortMessages([...withoutOptimistic, payload.new as Message]);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[MessageLoader] Subscription status:', status);
      });

    loadMessages();

    return () => {
      console.log('[MessageLoader] Cleaning up subscription');
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, isReady, loadAttempts, toast, setLoadAttempts, setMessages, setIsLoading]);
};
