import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types/template';

const ChatPage = () => {
  console.log('[ChatPage] Component initializing');
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
    handleSendMessage,
    loadChatMessages,
    currentChatId,
    setCurrentChatId
  } = useChat();

  // Initialize audio recovery
  useAudioRecovery();

  // Effect to handle sessionId changes
  useEffect(() => {
    console.log('[ChatPage] Session ID changed:', sessionId);
    if (sessionId) {
      setCurrentChatId(sessionId);
      loadChatMessages(sessionId);
    } else {
      // On index route, reset chat state
      setCurrentChatId(null);
    }
  }, [sessionId, setCurrentChatId, loadChatMessages]);

  // Handle patient selection changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    if (patientId !== selectedPatientId) {
      setSelectedPatientId(patientId);
      console.log('[ChatPage] Updated selected patient:', patientId);
    }
  }, [location.search, selectedPatientId]);

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[ChatPage] Patient selection changed:', patientId);
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
    console.log('[ChatPage] Template changed:', template.name);
  };

  const handleMessageSend = async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!currentChatId) {
      console.log('[ChatPage] Creating new session for first message');
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('[ChatPage] Created new session:', sessionId);
        setCurrentChatId(sessionId);
        
        const params = new URLSearchParams(location.search);
        navigate(`/c/${sessionId}?${params.toString()}`);
        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await handleSendMessage(message, type);
  };

  return (
    <div className="flex h-screen">
      <ChatContainer 
        messages={messages}
        isLoading={isChatLoading}
        currentChatId={currentChatId}
        onMessageSend={handleMessageSend}
        onPatientSelect={handlePatientSelect}
        selectedPatientId={selectedPatientId}
        onTemplateChange={handleTemplateChange}
        onTranscriptionComplete={async (text: string) => {
          console.log('[ChatPage] Transcription complete, ready for user to edit:', text);
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

export default ChatPage;