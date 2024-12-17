import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      const { data: sessions, error } = await supabase
        .from('chats')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(sessions || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTitle = async (messages: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-chat-title', {
        body: { messages }
      });

      if (error) throw error;
      return data.title;
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Chat';
    }
  };

  const createSession = async (messages: any[] = []) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const title = messages.length > 0 
        ? await generateTitle(messages)
        : 'New Chat';

      const { data, error } = await supabase
        .from('chats')
        .insert({ 
          title,
          user_id: user.id 
        })
        .select()
        .single();

      if (error) throw error;
      
      setSessions(prev => [data, ...prev]);
      setActiveSessionId(data.id);
      return data.id;
    } catch (error: any) {
      console.error('Error creating session:', error);
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
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  const renameSession = async (id: string, newTitle: string) => {
    try {
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
      console.error('Error renaming session:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename chat',
        variant: 'destructive',
      });
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        (payload) => {
          console.log('Chat change received:', payload);
          fetchSessions();
        }
      )
      .subscribe();

    fetchSessions();

    return () => {
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