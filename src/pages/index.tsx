import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { getDefaultTemplate, findTemplateById } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(() => {
    const defaultTemplate = getDefaultTemplate();
    console.log('[Index] Initializing with default template:', defaultTemplate.name);
    return defaultTemplate;
  });
  
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

  // Initialize audio recovery
  useAudioRecovery();

  // Handle URL parameters and routing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get('templateId');
    const patientId = params.get('patientId');
    
    // If we're on the root path with no session, ensure default template
    if (!sessionId && !currentChatId) {
      const defaultTemplate = getDefaultTemplate();
      setCurrentTemplate(defaultTemplate);
      navigate(`/?templateId=${defaultTemplate.id}`, { replace: true });
      return;
    }

    // If we have a session ID from the URL, load that chat
    if (sessionId && sessionId !== currentChatId) {
      console.log('[Index] Loading chat from URL session:', sessionId);
      loadChatMessages(sessionId);
      setCurrentChatId(sessionId);
    }
    
    // Handle template from URL
    if (templateId) {
      const template = findTemplateById(templateId);
      if (template && template.id !== currentTemplate?.id) {
        console.log('[Index] Loading template from URL:', template.name);
        setCurrentTemplate(template);
      }
    }
  }, [location.search, sessionId]);

  const handleSessionSelect = async (chatId: string) => {
    console.log('[Index] Selecting session:', chatId);
    const currentParams = new URLSearchParams(location.search);
    navigate(`/c/${chatId}?${currentParams.toString()}`);
    await loadChatMessages(chatId);
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed to:', template.name);
    setCurrentTemplate(template);
    
    // Update URL while preserving other parameters
    const params = new URLSearchParams(location.search);
    params.set('templateId', template.id);
    
    // Update URL based on whether we're in a chat session or not
    const baseUrl = sessionId ? `/c/${sessionId}` : '/';
    navigate(`${baseUrl}?${params.toString()}`);
  };

  const handleTranscriptionComplete = async (text: string) => {
    console.log('[Index] Transcription complete, ready for user to edit:', text);
    if (text) {
      const chatInput = document.querySelector('textarea');
      if (chatInput) {
        (chatInput as HTMLTextAreaElement).value = text;
        const event = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(event);
      }
    }
  };

  const handleMessageSend = async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!currentChatId) {
      console.log('[Index] Creating new session for first message with template:', currentTemplate?.name);
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('Created new session:', sessionId);
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
      currentTemplate?.systemInstructions
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
        onTranscriptionComplete={handleTranscriptionComplete}
      />
    </div>
  );
};

export default Index;