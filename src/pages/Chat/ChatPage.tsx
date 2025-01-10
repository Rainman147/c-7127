import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types/template';

const ChatPage = () => {
  const startTime = performance.now();
  console.log('[ChatPage] Initializing with session ID:', useParams().sessionId);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Effect to handle sessionId changes - only runs when sessionId changes and isn't already set
  useEffect(() => {
    const initStartTime = performance.now();
    console.log('[ChatPage] Session ID effect triggered:', { 
      sessionId, 
      currentChatId, 
      isInitialized,
      timeElapsed: `${(initStartTime - startTime).toFixed(2)}ms`
    });

    if (!sessionId || sessionId === currentChatId) {
      console.log('[ChatPage] Skipping initialization - session already matches or not provided');
      return;
    }

    const initializeChat = async () => {
      console.log('[ChatPage] Initializing chat with session:', sessionId);
      setCurrentChatId(sessionId);
      await loadChatMessages(sessionId);
      setIsInitialized(true);
      console.log('[ChatPage] Chat initialization complete:', {
        timeElapsed: `${(performance.now() - initStartTime).toFixed(2)}ms`
      });
    };

    initializeChat();

    // Cleanup function
    return () => {
      console.log('[ChatPage] Cleaning up chat initialization for session:', sessionId, {
        timeElapsed: `${(performance.now() - initStartTime).toFixed(2)}ms`
      });
      setIsInitialized(false);
    };
  }, [sessionId, currentChatId, setCurrentChatId, loadChatMessages]);

  // Handle patient selection changes - only update if different from current
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    if (patientId !== selectedPatientId) {
      console.log('[ChatPage] Updating selected patient:', patientId);
      setSelectedPatientId(patientId);
    }
  }, [location.search, selectedPatientId]);

  const handlePatientSelect = useCallback(async (patientId: string | null) => {
    console.log('[ChatPage] Patient selection changed:', patientId);
    
    if (patientId === selectedPatientId) {
      console.log('[ChatPage] Skipping patient selection - already selected');
      return;
    }
    
    setSelectedPatientId(patientId);
    
    const params = new URLSearchParams(location.search);
    if (patientId) {
      params.set('patientId', patientId);
    } else {
      params.delete('patientId');
    }
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [location.pathname, location.search, navigate, selectedPatientId]);

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[ChatPage] Template changed:', template.name);
  }, []);

  const handleMessageSend = useCallback(async (message: string, type: 'text' | 'audio' = 'text') => {
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
  }, [currentChatId, createSession, handleSendMessage, location.search, navigate, setCurrentChatId]);

  // Only render ChatContainer once initialization is complete
  if (!isInitialized && sessionId) {
    console.log('[ChatPage] Waiting for chat initialization...');
    return <div>Loading chat session...</div>;
  }

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