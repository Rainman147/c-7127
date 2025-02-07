
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import { useTemplateQuery } from '@/hooks/queries/useTemplateQueries';
import { useDraftMessage } from '@/hooks/useDraftMessage';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  console.log('[Index] Component initializing');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get template ID from URL
  const params = new URLSearchParams(location.search);
  const templateId = params.get('templateId');
  
  // Query for selected template
  const { 
    data: selectedTemplate, 
    isLoading: isTemplateLoading,
    error: templateError 
  } = useTemplateQuery(templateId);

  // Initialize draft message handling
  const { draftMessage, setDraftMessage, clearDraft } = useDraftMessage(templateId, selectedPatientId);

  // Initialize audio recovery
  useAudioRecovery();

  // Handle patient selection changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    if (patientId !== selectedPatientId) {
      setSelectedPatientId(patientId);
      console.log('[Index] Updated selected patient:', patientId);
    }
  }, [location.search, selectedPatientId]);

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[Index] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
    updatePatientId(patientId);
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed:', template.name);
    updateTemplateId(template.id);
  };

  const handleMessageSend = async (message: string, type: 'text' | 'audio' = 'text') => {
    console.log('[Index] Sending message:', { content: message, type });
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        'https://hlnzunnahksudbotqvpk.supabase.co/functions/v1/chat-completion',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            content: message,
            type,
            templateId,
            patientId: selectedPatientId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Clear draft after successful send
      clearDraft();
      
      // Navigate to the chat page
      navigate(`/c/${data.chatId}`);

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

  return (
    <div className="flex h-screen">
      {templateError && (
        <Alert variant="destructive" className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-96">
          <AlertTitle>Template Error</AlertTitle>
          <AlertDescription>{templateError.message}</AlertDescription>
        </Alert>
      )}
      <ChatContainer 
        messages={[]}
        isLoading={isLoading || isTemplateLoading}
        currentChatId={null}
        onMessageSend={handleMessageSend}
        onTemplateChange={handleTemplateChange}
        onPatientSelect={handlePatientSelect}
        selectedPatientId={selectedPatientId}
        draftMessage={draftMessage}
        onDraftChange={setDraftMessage}
        onTranscriptionComplete={async (text: string) => {
          console.log('[Index] Transcription complete, ready for user to edit:', text);
          if (text) {
            setDraftMessage(text);
          }
        }}
      />
    </div>
  );
};

export default Index;
