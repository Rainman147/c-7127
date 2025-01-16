import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types/template';

const Index = () => {
  console.log('[Index] Component initializing');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const { 
    messages, 
    isLoading, 
    handleSendMessage,
    chatId,
    setChatId
  } = useChat();

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

  return (
    <div className="flex h-screen">
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        currentChatId={chatId}
        onMessageSend={handleSendMessage}
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