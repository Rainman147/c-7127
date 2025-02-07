
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchTemplates } from '@/hooks/queries/useTemplateQueries';

const Index = () => {
  console.log('[Index] Component initializing');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  const queryClient = useQueryClient();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { session } = useSessionManagement();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add session monitoring
  useEffect(() => {
    console.log('[Index] Current session state:', session ? 'Authenticated' : 'Not authenticated');
    
    if (!session) {
      console.log('[Index] No active session, redirecting to auth page');
      navigate('/auth');
    }
  }, [session, navigate]);

  // Prefetch templates on initial load if user is authenticated
  useEffect(() => {
    if (session) {
      console.log('[Index] Session active, prefetching templates');
      prefetchTemplates(queryClient).catch(error => {
        console.error('Error prefetching templates:', error);
      });
    }
  }, [session, queryClient]);

  const handleMessageSend = async (content: string, type: 'text' | 'audio' = 'text') => {
    console.log('[Index] Attempting to send message:', { content, type });
    
    if (!session) {
      console.log('[Index] No active session, redirecting to auth');
      navigate('/auth');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Index] Making chat-manager request with session:', session.user.id);
      const response = await supabase.functions.invoke('chat-manager', {
        body: {
          content,
          type,
          templateId: new URLSearchParams(window.location.search).get('templateId'),
          patientId: selectedPatientId
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { chatId, messages: newMessages } = response.data;
      console.log('Chat manager response:', { chatId, messageCount: newMessages.length });

      // Navigate to the chat page
      navigate(`/c/${chatId}`);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptionComplete = async (text: string) => {
    console.log('[Index] Transcription completed:', text);
    await handleMessageSend(text, 'text');
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[Index] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
    updatePatientId(patientId);
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed:', template.name);
    updateTemplateId(template.id);
  };

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      currentChatId={null}
      onMessageSend={handleMessageSend}
      onTranscriptionComplete={handleTranscriptionComplete}
      onTemplateChange={handleTemplateChange}
      onPatientSelect={handlePatientSelect}
      selectedPatientId={selectedPatientId}
    />
  );
};

export default Index;
