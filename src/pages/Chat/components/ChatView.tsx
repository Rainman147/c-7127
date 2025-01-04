import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useURLStateService } from '@/features/routing/services/urlStateService';
import { useTemplateStateService } from '@/features/templates/services/templateStateService';
import type { Template } from '@/components/template/types';

interface ChatViewProps {
  sessionId?: string;
}

const ChatView = ({ sessionId }: ChatViewProps) => {
  console.log('[ChatView] Initializing with sessionId:', sessionId);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const { 
    messages, 
    isLoading, 
    handleSendMessage,
    loadChatMessages,
    currentChatId,
    setCurrentChatId
  } = useChat();

  const { urlState, handleTemplateChange: updateUrlTemplate } = useURLStateService(currentChatId);
  
  const { selectedTemplate, handleTemplateChange: updateTemplateState } = useTemplateStateService({
    currentChatId,
    initialTemplateId: urlState.templateId,
    onTemplateChange: (template) => {
      console.log('[ChatView] Template changed:', template.name);
    }
  });

  const handleTemplateChange = (template: Template) => {
    console.log('[ChatView] Template change requested:', template.name);
    updateTemplateState(template);
    updateUrlTemplate(template);
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[ChatView] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
  };

  const handleMessageSend = async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!currentChatId) {
      console.log('[ChatView] Creating new session for first message');
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('[ChatView] Created new session:', sessionId);
        setCurrentChatId(sessionId);
        
        // Update URL with new session ID while preserving other parameters
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
        onTranscriptionComplete={(text: string) => {
          console.log('[ChatView] Transcription complete:', text);
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

export default ChatView;
