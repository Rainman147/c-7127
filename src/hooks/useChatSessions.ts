
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/auth/AuthContext';
import { ChatSession, Message } from '@/types/chat/types';
import { toFrontendChatSession } from '@/utils/transforms/chat';
import type { DbChat } from '@/types/database';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [temporarySession, setTemporarySession] = useState<ChatSession | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session: authSession } = useAuth();

  // Load initial sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (!authSession?.user) return;

        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fetched chat sessions:', data);
        setSessions(data?.map(chat => toFrontendChatSession(chat as DbChat)) || []);
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load chat sessions",
          variant: "destructive",
        });
      }
    };

    fetchSessions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        (payload) => {
          console.log('Chat update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [
              toFrontendChatSession(payload.new as DbChat),
              ...prev
            ]);
          } else if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(session => session.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev => prev.map(session => 
              session.id === payload.new.id 
                ? toFrontendChatSession(payload.new as DbChat)
                : session
            ));
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [authSession?.user, toast]);

  const createSession = useCallback(async () => {
    try {
      if (!authSession?.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a chat session",
          variant: "destructive",
        });
        return null;
      }

      const tempSession: ChatSession = {
        id: crypto.randomUUID(),
        userId: authSession.user.id,
        title: 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        isTemporary: true
      };
      
      setTemporarySession(tempSession);
      console.log('Created temporary chat session:', tempSession);
      return tempSession;
    } catch (error) {
      console.error('Error creating temporary chat session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
      return null;
    }
  }, [authSession?.user, toast]);

  const persistSession = useCallback(async (sessionId: string, firstMessage?: Message) => {
    if (!temporarySession || temporarySession.id !== sessionId) return null;

    try {
      if (!authSession) {
        toast({
          title: "Authentication Error",
          description: "Please log in to save chat session",
          variant: "destructive",
        });
        return null;
      }

      // Start transition
      setTemporarySession(prev => prev ? { ...prev, isTransitioning: true } : null);

      // Let supabase.functions.invoke handle auth automatically
      const { data, error } = await supabase.functions.invoke('direct-chat', {
        body: {
          tempId: sessionId,
          title: temporarySession.title,
          message: firstMessage
        }
      });

      if (error) {
        console.error('[persistSession] Edge function error:', error);
        // Revert transition state
        setTemporarySession(prev => prev ? { ...prev, isTransitioning: false } : null);
        throw error;
      }

      console.log('[persistSession] Chat persisted successfully:', data);

      // Update route to new permanent ID
      navigate(`/c/${data.chatId}`);
      
      setTemporarySession(null);
      return data;
    } catch (error) {
      console.error('[persistSession] Error persisting chat session:', error);
      // Revert transition state
      setTemporarySession(prev => prev ? { ...prev, isTransitioning: false } : null);
      
      toast({
        title: "Error",
        description: "Failed to save chat session",
        variant: "destructive",
      });
      return null;
    }
  }, [temporarySession, authSession, toast, navigate]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      // If it's a temporary session, just remove it from state
      if (temporarySession?.id === sessionId) {
        setTemporarySession(null);
        return;
      }

      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      console.log('Deleted chat session:', sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));

      // Navigate away if the active session is deleted
      if (activeSessionId === sessionId) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  }, [temporarySession, activeSessionId, toast, navigate]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      // If it's a temporary session, update it in state
      if (temporarySession?.id === sessionId) {
        setTemporarySession(prev => prev ? { ...prev, title: newTitle } : null);
        return;
      }

      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', sessionId);

      if (error) throw error;
      
      console.log('Renamed chat session:', sessionId, 'to:', newTitle);
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? { ...session, title: newTitle } : session
      ));
    } catch (error) {
      console.error('Error renaming chat session:', error);
      toast({
        title: "Error",
        description: "Failed to rename chat session",
        variant: "destructive",
      });
    }
  }, [temporarySession, toast]);

  return {
    sessions: temporarySession 
      ? [temporarySession, ...sessions]
      : sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
    persistSession,
  };
};
