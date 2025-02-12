
import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/types';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useChatMessageState } from '@/features/chat/hooks/useChatMessageState';
import { useMessageLoader } from '@/features/chat/hooks/useMessageLoader';
import { useMessageSender } from '@/features/chat/hooks/useMessageSender';

const ChatPage = () => {
  console.log('[ChatPage] Component initializing');
  
  const location = useLocation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateTemplateId, updatePatientId } = useUrlStateManager();
  const { session, status } = useAuth();
  const { createSession, setActiveSessionId, persistSession } = useChatSessions();
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [directMode, setDirectMode] = useState(false);

  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    loadAttempts,
    setLoadAttempts,
    isReady,
    setIsReady
  } = useChatMessageState();

  // Handle authentication readiness
  useEffect(() => {
    console.log('[ChatPage] Auth status changed:', status);
    if (status === 'AUTHENTICATED' && session?.user) {
      setIsReady(true);
    } else if (status === 'UNAUTHENTICATED') {
      setIsReady(false);
      setMessages([]);
    }
  }, [status, session, setMessages, setIsReady]);

  // Update active session when route changes
  useEffect(() => {
    if (sessionId) {
      console.log('[ChatPage] Setting active session:', sessionId);
      setActiveSessionId(sessionId);
    }
  }, [sessionId, setActiveSessionId]);

  // Handle initial session creation if needed
  useEffect(() => {
    const initializeChat = async () => {
      if (!sessionId && session?.user && status === 'AUTHENTICATED') {
        console.log('[ChatPage] Creating new chat session');
        try {
          const newChat = await createSession();
          if (newChat?.id) {
            console.log('[ChatPage] Redirecting to new chat:', newChat.id);
            setActiveSessionId(newChat.id);
            navigate(`/c/${newChat.id}`, { replace: true });
          }
        } catch (error) {
          console.error('[ChatPage] Error creating chat session:', error);
          toast({
            title: "Error",
            description: "Failed to create new chat session",
            variant: "destructive",
          });
        }
      }
    };

    initializeChat();
  }, [sessionId, session?.user, status, createSession, navigate, toast, setActiveSessionId]);

  // Load messages and set up realtime subscription
  useMessageLoader({
    sessionId,
    isReady,
    loadAttempts,
    setLoadAttempts,
    setMessages,
    setIsLoading
  });

  const handleMessageSend = useMessageSender(
    sessionId, 
    setMessages, 
    setIsLoading, 
    messages,
    persistSession
  );

  const handleDirectModeToggle = () => {
    setDirectMode(!directMode);
    console.log('[ChatPage] Direct mode toggled:', !directMode);
    toast({
      title: `Switched to ${!directMode ? 'Direct' : 'Context'} Mode`,
      description: !directMode 
        ? "Messages will be sent directly to AI without context" 
        : "Messages will include context and template information",
      duration: 3000,
    });
  };

  const handleTranscriptionComplete = async (text: string) => {
    console.log('[ChatPage] Transcription completed:', text);
    await handleMessageSend(text, 'text', directMode);
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

  const handleSendMessage = async (content: string, type: 'text' | 'audio', useDirectMode: boolean) => {
    console.log('[ChatPage] Sending message:', { content, type, useDirectMode });
    await handleMessageSend(content, type, useDirectMode);
  };

  return (
    <ChatContainer 
      messages={messages}
      isLoading={isLoading || status === 'INITIALIZING'}
      currentChatId={sessionId || null}
      onMessageSend={handleSendMessage}
      onTranscriptionComplete={handleTranscriptionComplete}
      onTemplateChange={handleTemplateChange}
      onPatientSelect={handlePatientSelect}
      selectedPatientId={selectedPatientId}
      directMode={directMode}
      onDirectModeToggle={handleDirectModeToggle}
    />
  );
};

export default ChatPage;
