import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useTemplateSelection } from '@/components/template/useTemplateSelection';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/components/template/types';

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
    isLoading, 
    handleSendMessage,
    loadChatMessages,
    currentChatId,
    setCurrentChatId
  } = useChat();

  const { selectedTemplate, handleTemplateChange } = useTemplateSelection(currentChatId, (template: Template) => {
    console.log('[Index] Template changed:', template.name);
  });

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
    await loadChatMessages(chatId);
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

  return (
    <div className="flex h-screen">
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
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