import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { logger, LogCategory } from '@/utils/logging';
import { RealtimeChannel } from '@supabase/supabase-js';

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      // Get current session to ensure we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.error(LogCategory.DATABASE, 'ChatSessions', 'Auth session error:', {
          error: sessionError,
          timestamp: new Date().toISOString()
        });
        throw sessionError;
      }

      if (!session) {
        logger.warn(LogCategory.DATABASE, 'ChatSessions', 'No active session');
        return;
      }

      console.log('[useChatSessions] Fetching chat sessions');
      const { data: sessions, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error(LogCategory.DATABASE, 'ChatSessions', 'Error fetching sessions:', {
          error: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }
      
      // Filter out sessions with no messages
      const { data: sessionsWithMessages, error: messagesError } = await supabase
        .from('messages')
        .select('chat_id')
        .in('chat_id', sessions?.map(s => s.id) || []);
        
      if (messagesError) {
        logger.error(LogCategory.DATABASE, 'ChatSessions', 'Error fetching messages:', {
          error: messagesError.message,
          code: messagesError.code
        });
        throw messagesError;
      }
      
      const validSessionIds = new Set(sessionsWithMessages?.map(m => m.chat_id));
      const validSessions = sessions?.filter(s => validSessionIds.has(s.id)) || [];
      
      console.log('[useChatSessions] Filtered sessions:', validSessions);
      setSessions(validSessions);
    } catch (error: any) {
      console.error('[useChatSessions] Error fetching sessions:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to load chat sessions. Please check your internet connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the fetch function to prevent multiple rapid refreshes
  const [debouncedFetchSessions] = useDebounce(fetchSessions, 300);

  const createSession = async (title: string = 'New Chat', templateType: string = 'live-patient-session') => {
    try {
      console.log('[useChatSessions] Creating new session:', { title, templateType });
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chats')
        .insert({ 
          title,
          user_id: user.id,
          template_type: templateType
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('[useChatSessions] Created session:', data);
      setSessions(prev => [data, ...prev]);
      setActiveSessionId(data.id);
      return data.id;
    } catch (error: any) {
      console.error('[useChatSessions] Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSession = async (id: string) => {
    try {
      console.log('[useChatSessions] Deleting session:', id);
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }

      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
      });
    } catch (error: any) {
      console.error('[useChatSessions] Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  const renameSession = async (id: string, newTitle: string) => {
    try {
      console.log('[useChatSessions] Renaming session:', id, 'to:', newTitle);
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', id);

      if (error) throw error;

      setSessions(prev =>
        prev.map(session =>
          session.id === id ? { ...session, title: newTitle } : session
        )
      );

      toast({
        title: 'Success',
        description: 'Chat renamed successfully',
      });
    } catch (error: any) {
      console.error('[useChatSessions] Error renaming session:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename chat',
        variant: 'destructive',
      });
    }
  };

  // Set up real-time subscription for both chats and messages tables
  useEffect(() => {
    console.log('[useChatSessions] Setting up real-time subscription');
    const channel = supabase
      .channel('chat-and-message-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          console.log('[useChatSessions] Chat change received:', payload);
          fetchSessions();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('[useChatSessions] Message change received:', payload);
          fetchSessions();
        }
      )
      .subscribe((status) => {
        console.log('[useChatSessions] Subscription status:', status);
        
        if (status === 'CHANNEL_ERROR') {
          logger.error(LogCategory.WEBSOCKET, 'ChatSessions', 'Subscription error');
          toast({
            title: 'Connection Error',
            description: 'Failed to establish real-time connection. Some features may be limited.',
            variant: 'destructive',
          });
        }
      });

    // Initial fetch
    fetchSessions();

    return () => {
      console.log('[useChatSessions] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading,
    createSession,
    deleteSession,
    renameSession,
  };
};