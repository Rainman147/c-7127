
import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { supabase } from '@/integrations/supabase/client';
import type { Message, MessageRole } from '@/types/chat';

const ChatPage = () => {
  console.log('[ChatPage] Component initializing');
  
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { session } = useSessionManagement();
  const { activeSessionId } = useChatSessions();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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

    // Real-time subscription with reconnection logic
    const setupSubscription = () => {
      const subscription = supabase
        .channel(`messages:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${sessionId}`
          },
          (payload) => {
            console.log('Message change received:', payload);
            if (payload.eventType === 'INSERT' && isSubscribed) {
              setMessages(prev => [...prev, payload.new as Message]);
              setRetryCount(0); // Reset retry count on successful message
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIPTION_ERROR' && retryCount < MAX_RETRIES) {
            console.log(`Retrying subscription (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              subscription.unsubscribe();
              setupSubscription();
            }, Math.min(1000 * Math.pow(2, retryCount), 10000)); // Exponential backoff
          }
          
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to messages');
            setRetryCount(0);
          }
        });

      return subscription;
    };

    const subscription = setupSubscription();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [sessionId, toast, retryCount]);

  const handleMessageSend = async (content: string, type: 'text' | 'audio' = 'text') => {
    console.log('[ChatPage] Sending message:', { content, type });
    
    if (!sessionId || !session) {
      console.error('No active session or user');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        'https://hlnzunnahksudbotqvpk.supabase.co/functions/v1/chat-completion',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
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

      const data = await response.json();
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
