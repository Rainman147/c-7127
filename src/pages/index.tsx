import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useTemplateQuery } from '@/hooks/queries/useTemplateQueries';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';

const Index = () => {
  console.log('[Index] Component initializing');
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { session } = useSessionManagement();
  const { createSession } = useChatSessions();

  // Temporary stubs for removed chat functionality
  const messages = [];
  const isLoading = false;
  const currentChatId = null;
  
  // Get template ID from URL
  const params = new URLSearchParams(location.search);
  const templateId = params.get('templateId');

  // Query for selected template
  const { 
    data: selectedTemplate, 
    isLoading: isTemplateLoading,
    error: templateError 
  } = useTemplateQuery(templateId);

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
    console.log('[Index] Message sending temporarily disabled');
    toast({
      title: "Info",
      description: "Message sending is temporarily disabled during system rebuild",
    });
  };

  // Show error toast if template error occurs
  useEffect(() => {
    if (templateError) {
      toast({
        title: "Template Error",
        description: templateError.message,
        variant: "destructive",
      });
    }
  }, [templateError, toast]);

  const isPageLoading = isTemplateLoading;

  return (
    <div className="flex h-screen">
      {templateError && (
        <Alert variant="destructive" className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-96">
          <AlertTitle>Template Error</AlertTitle>
          <AlertDescription>{templateError.message}</AlertDescription>
        </Alert>
      )}
      <ChatContainer 
        messages={messages}
        isLoading={isPageLoading}
        currentChatId={currentChatId}
        onMessageSend={handleMessageSend}
        onTemplateChange={handleTemplateChange}
        onPatientSelect={handlePatientSelect}
        selectedPatientId={selectedPatientId}
        onTranscriptionComplete={async (text: string) => {
          console.log('[Index] Transcription complete, ready for user to edit:', text);
          if (text) {
            const chatInput = document.querySelector('textarea');
            if (chatInput) {
              (chatInput as HTMLTextAreaElement).value = text;
              const event = new Event('input', { bubbles: true });
              chatInput.dispatchEvent(event);
            }
          }
        }}
      />
    </div>
  );
};

export default Index;