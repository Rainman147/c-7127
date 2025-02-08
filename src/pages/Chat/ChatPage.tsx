
import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const ChatPage = () => {
  console.log('[ChatPage] Component initializing');
  
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { session } = useAuth();
  const { activeSessionId } = useChatSessions();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to messages for the current chat
  useEffect(() => {
    if (!sessionId) return;

    let isSubscribed = true;

    // Initial messages load
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', sessionId)
          .order('created_at');

        if (error) throw error;

        if (isSubscribed) {
          setMessages(data as Message[]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error loading messages",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      }
    };

    loadMessages();

    // Real-time subscription
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
          console.log('Message change received:', payload);
          if (payload.eventType === 'INSERT' && isSubscribed) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  const handleMessageSend = async (content: string, type: 'text' | 'audio' = 'text') => {
    console.log('[ChatPage] Sending message:', { content, type });
    
    if (!sessionId || !session) {
      console.error('No active session or user');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-manager', {
        body: {
          chatId: sessionId,
          content,
          type
        }
      });

      if (error) throw error;

      console.log('Message sent successfully:', data);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again. If the problem persists, check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptionComplete = async (text: string) => {
    console.log('[ChatPage] Transcription completed:', text);
    await handleMessageSend(text, 'text');
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[ChatPage] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
    updatePatientId(patientId);
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[ChatPage] Template changed:', template.name);
    updateTemplateId(template.id);
  };

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      currentChatId={sessionId || null}
      onMessageSend={handleMessageSend}
      onTranscriptionComplete={handleTranscriptionComplete}
      onTemplateChange={handleTemplateChange}
      onPatientSelect={handlePatientSelect}
      selectedPatientId={selectedPatientId}
    />
  );
};

export default ChatPage;
