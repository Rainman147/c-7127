import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useMessageSubscriptions = (chatId: string | null) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const setupSubscription = (onUpdate: () => void) => {
    if (!chatId) return;

    console.log('[useMessageSubscriptions] Setting up subscription for chat:', chatId);
    
    channelRef.current = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          console.log('[useMessageSubscriptions] Message update received for chat:', chatId);
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        console.log('[useMessageSubscriptions] Cleaning up subscription for chat:', chatId);
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  };

  return { setupSubscription };
};