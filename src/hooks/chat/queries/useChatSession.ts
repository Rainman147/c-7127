import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sessionKeys } from '@/types/chat';
import type { ChatSession } from '@/types/chat';

export const useChatSession = (sessionId: string | null) => {
  console.log('[useChatSession] Initializing with sessionId:', sessionId);
  
  return useQuery({
    queryKey: sessionId ? sessionKeys.detail(sessionId) : null,
    queryFn: async () => {
      console.log('[useChatSession] Fetching session:', sessionId);
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
        
      if (error) {
        console.error('[useChatSession] Error fetching session:', error);
        throw error;
      }
      
      return data as ChatSession | null;
    },
    gcTime: 1000 * 60 * 60, // 1 hour
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!sessionId,
  });
};