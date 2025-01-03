import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { getDefaultTemplate, findTemplateById } from '@/utils/template/templateStateManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/components/template/types';

const Index = () => {
  console.log('[Index] Component initializing');
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(() => {
    const defaultTemplate = getDefaultTemplate();
    console.log('[Index] Setting default template:', defaultTemplate.name);
    return defaultTemplate;
  });
  
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

  // Initialize audio recovery
  useAudioRecovery();

  // Handle URL parameters and routing
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get('templateId');
    const patientId = params.get('patientId');
    
    console.log('[Index] Processing URL parameters:', { templateId, patientId });

    // Update selected patient state
    if (patientId !== selectedPatientId) {
      setSelectedPatientId(patientId);
      console.log('[Index] Updated selected patient:', patientId);
    }

    // Handle template selection from URL
    if (templateId) {
      const template = findTemplateById(templateId);
      if (template && template.id !== currentTemplate?.id) {
        console.log('[Index] Loading template from URL:', template.name);
        setCurrentTemplate(template);
      }
    }

    // If we have a patient but no template, add default template
    if (patientId && !templateId) {
      const defaultTemplate = getDefaultTemplate();
      const newParams = new URLSearchParams(params);
      newParams.set('templateId', defaultTemplate.id);
      console.log('[Index] Adding default template to URL for patient');
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    }

    // If we have neither patient nor template and we're not on the root path
    if (!patientId && !templateId && location.search) {
      console.log('[Index] Cleaning URL - no parameters needed');
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, sessionId, currentTemplate?.id, selectedPatientId, navigate, location.pathname]);

  const handleSessionSelect = async (chatId: string) => {
    console.log('[Index] Selecting session:', chatId);
    const currentParams = new URLSearchParams(location.search);
    navigate(`/c/${chatId}?${currentParams.toString()}`);
    await loadChatMessages(chatId);
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed to:', template.name);
    setCurrentTemplate(template);
    
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    // Clear parameters if switching to default template without patient
    if (template.id === getDefaultTemplate().id && !patientId) {
      console.log('[Index] Removing template from URL (default template, no patient)');
      navigate(location.pathname, { replace: true });
      return;
    }
    
    // Update template in URL
    params.set('templateId', template.id);
    console.log('[Index] Updating template in URL:', template.id);
    
    // Maintain parameter order: templateId first, then patientId
    const orderedParams = new URLSearchParams();
    orderedParams.set('templateId', template.id);
    if (patientId) {
      orderedParams.set('patientId', patientId);
    }
    
    const search = orderedParams.toString();
    const baseUrl = sessionId ? `/c/${sessionId}` : '/';
    const newUrl = search ? `${baseUrl}?${search}` : baseUrl;
    
    navigate(newUrl, { replace: true });
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[Index] Patient selection changed:', patientId);
    
    const params = new URLSearchParams(location.search);
    
    if (patientId) {
      // When selecting a patient, ensure we have a template (use default if none)
      const templateId = params.get('templateId') || getDefaultTemplate().id;
      
      // Maintain parameter order: templateId first, then patientId
      const orderedParams = new URLSearchParams();
      orderedParams.set('templateId', templateId);
      orderedParams.set('patientId', patientId);
      
      const newUrl = `${location.pathname}?${orderedParams.toString()}`;
      navigate(newUrl, { replace: true });
    } else {
      // When deselecting patient, keep template only if non-default
      const currentTemplateId = params.get('templateId');
      if (currentTemplateId && currentTemplateId !== getDefaultTemplate().id) {
        params.delete('patientId');
        navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      } else {
        // Clean URL if default template and no patient
        navigate(location.pathname, { replace: true });
      }
    }
    
    setSelectedPatientId(patientId);
  };

  const handleMessageSend = async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!currentChatId) {
      console.log('[Index] Creating new session for first message with template:', currentTemplate?.name);
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('[Index] Created new session:', sessionId);
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
