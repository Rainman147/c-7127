
import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
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

  const sortMessages = (msgs: Message[]): Message[] => {
    return [...msgs].sort((a, b) => {
      // First sort by createdAt
      const timeComparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (timeComparison !== 0) return timeComparison;
      
      // If timestamps are equal, use sortIndex from metadata
      const aIndex = a.metadata?.sortIndex || 0;
      const bIndex = b.metadata?.sortIndex || 0;
      return aIndex - bIndex;
    });
  };

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
          const frontendMessages = (data || []).map(toFrontendMessage);
          setMessages(sortMessages(frontendMessages));
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
            setMessages(prev => {
              // Find and remove any optimistic message with matching tempId
              const withoutOptimistic = prev.filter(m => 
                m.metadata?.tempId !== payload.new.metadata?.tempId || 
                !m.metadata?.isOptimistic
              );
              
              // Add the new message and sort
              return sortMessages([...withoutOptimistic, payload.new as Message]);
            });
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

    // Create optimistic message
    const tempId = uuidv4();
    const now = new Date().toISOString();
    const optimisticMessage: Message = {
      chatId: sessionId,
      content,
      type,
      role: 'user',
      status: 'pending',
      metadata: {
        tempId,
        isOptimistic: true,
        sortIndex: messages.length
      },
      createdAt: now,
    };

    // Add optimistic message to UI
    setMessages(prev => sortMessages([...prev, optimisticMessage]));

    try {
      const endpoint = directMode ? 'direct-chat' : 'chat-manager';
      console.log('[ChatPage] Using endpoint:', endpoint);
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: {
          chatId: sessionId,
          content,
          type,
          metadata: { 
            tempId,
            sortIndex: messages.length
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        // Update optimistic message to error state
        setMessages(prev => prev.map(m => 
          m.metadata?.tempId === tempId
            ? { ...m, status: 'error' }
            : m
        ));
        throw error;
      }

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
