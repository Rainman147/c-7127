import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
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

  // Load initial sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fetched chat sessions:', data);
        // Transform database records to frontend type
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
  }, [toast]);

  const createSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create a temporary session with a UUID
      const tempSession: ChatSession = {
        id: crypto.randomUUID(),
        userId: user.id,
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
  }, [toast]);

  const persistSession = useCallback(async (sessionId: string, firstMessage?: Message) => {
    if (!temporarySession || temporarySession.id !== sessionId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Start transition
      setTemporarySession(prev => prev ? { ...prev, isTransitioning: true } : null);

      // Create chat and first message in a transaction through the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/direct-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempId: sessionId,
          title: temporarySession.title,
          message: firstMessage
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to persist chat: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Persisted chat session:', data);

      // Update route to new permanent ID
      navigate(`/c/${data.chatId}`);
      
      setTemporarySession(null);
      return data;
    } catch (error) {
      console.error('Error persisting chat session:', error);
      // Revert transition state
      setTemporarySession(prev => prev ? { ...prev, isTransitioning: false } : null);
      
      toast({
        title: "Error",
        description: "Failed to save chat session",
        variant: "destructive",
      });
      return null;
    }
  }, [temporarySession, toast, navigate]);

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
