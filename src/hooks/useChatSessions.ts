
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [temporarySession, setTemporarySession] = useState<any>(null);
  const { toast } = useToast();

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
        setSessions(data || []);
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
            setSessions(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(session => session.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev => prev.map(session => 
              session.id === payload.new.id ? { ...session, ...payload.new } : session
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const createSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create a temporary session in memory
      const tempSession = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: 'New Chat',
        created_at: new Date().toISOString(),
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

  const persistSession = useCallback(async (sessionId: string) => {
    if (!temporarySession || temporarySession.id !== sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('chats')
        .insert([
          { 
            user_id: user.id,
            title: temporarySession.title
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Persisted chat session:', data);
      setTemporarySession(null);
      return data;
    } catch (error) {
      console.error('Error persisting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to save chat session",
        variant: "destructive",
      });
      return null;
    }
  }, [temporarySession, toast]);

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
    } catch (error) {
      console.error('Error deleting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  }, [temporarySession, toast]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      // If it's a temporary session, update it in state
      if (temporarySession?.id === sessionId) {
        setTemporarySession(prev => ({ ...prev, title: newTitle }));
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
