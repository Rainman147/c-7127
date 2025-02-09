
import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toFrontendMessage } from '@/utils/transforms';

const ChatPage = () => {
  console.log('[ChatPage] Component initializing');
  
  const location = useLocation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  const { session } = useAuth();
  const { createSession } = useChatSessions();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [directMode, setDirectMode] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      if (!sessionId && session?.user) {
        console.log('[ChatPage] Creating new chat session');
        try {
          const newChat = await createSession();
          if (newChat?.id) {
            console.log('[ChatPage] Redirecting to new chat:', newChat.id);
            navigate(`/c/${newChat.id}`, { replace: true });
          }
        } catch (error) {
          console.error('[ChatPage] Error creating chat session:', error);
          toast({
            title: "Error",
            description: "Failed to create new chat session",
            variant: "destructive",
          });
        }
      }
    };

    initializeChat();
  }, [sessionId, session?.user, createSession, navigate, toast]);

  useEffect(() => {
    if (!sessionId) return;

    let isSubscribed = true;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', sessionId)
          .order('created_at');

        if (error) throw error;

        if (isSubscribed) {
          setMessages((data || []).map(toFrontendMessage));
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
          } else if (payload.eventType === 'UPDATE' && isSubscribed) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
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
    console.log('[ChatPage] Sending message:', { content, type, directMode });
    
    if (!sessionId || !session) {
      console.error('No active session or user');
      return;
    }

    setIsLoading(true);

    try {
      // Add optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: sessionId,
        role: 'user',
        content,
        type,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/direct-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            chatId: sessionId,
            content,
            type
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') {
              console.log('[ChatPage] Stream complete');
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                console.log('[ChatPage] Received content:', parsed.content);
              }
            } catch (e) {
              console.error('[ChatPage] Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again. If the problem persists, check your connection.",
        variant: "destructive",
      });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectModeToggle = () => {
    setDirectMode(!directMode);
    console.log('[ChatPage] Direct mode toggled:', !directMode);
    toast({
      title: `Switched to ${!directMode ? 'Direct' : 'Context'} Mode`,
      description: !directMode 
        ? "Messages will be sent directly to AI without context" 
        : "Messages will include context and template information",
      duration: 3000,
    });
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
      directMode={directMode}
      onDirectModeToggle={handleDirectModeToggle}
    />
  );
};

export default ChatPage;
