import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useTemplateQuery } from '@/hooks/queries/useTemplateQueries';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { Template } from '@/types/template';

const Index = () => {
  console.log('[Index] Component initializing');
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { session } = useSessionManagement();
  const { createSession } = useChatSessions();
  
  const { 
    messages, 
    isLoading: isChatLoading, 
    error: chatError,
    handleSendMessage,
    loadChatMessages,
    currentChatId,
    setCurrentChatId
  } = useChat();

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

  const handleSessionSelect = async (chatId: string) => {
    console.log('[Index] Selecting session:', chatId);
    const currentParams = new URLSearchParams(location.search);
    navigate(`/c/${chatId}?${currentParams.toString()}`);
    await loadChatMessages({ throwOnError: true });
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[Index] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
    
    const params = new URLSearchParams(location.search);
    if (patientId) {
      params.set('patientId', patientId);
    } else {
      params.delete('patientId');
    }
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed:', template.name);
    const params = new URLSearchParams(location.search);
    if (template.id === 'live-session') {
      params.delete('templateId');
    } else {
      params.set('templateId', template.id);
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handleMessageSend = async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!currentChatId) {
      console.log('[Index] Creating new session for first message');
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('[Index] Created new session:', sessionId);
        setCurrentChatId(sessionId);
        
        const params = new URLSearchParams(location.search);
        navigate(`/c/${sessionId}?${params.toString()}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await handleSendMessage(
      message, 
      type, 
      selectedTemplate?.systemInstructions
    );
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

  const isLoading = isChatLoading || isTemplateLoading;
  const error = chatError || templateError;

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
        isLoading={isLoading}
        currentChatId={currentChatId}
        onMessageSend={handleMessageSend}
        onTemplateChange={handleTemplateChange}
        onPatientSelect={handlePatientSelect}
        selectedPatientId={selectedPatientId}
        error={error}
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