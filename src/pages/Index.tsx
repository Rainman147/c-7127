import { useState, useCallback, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/ChatHeader';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { useSessionParams } from '@/hooks/routing/useSessionParams';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ChatContent = () => {
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sessionId, 
    templateId, 
    patientId, 
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    isValidPatientId 
  } = useSessionParams();
  
  const { messages, isLoading, handleSendMessage } = useChat(sessionId);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Handle invalid routes
  useEffect(() => {
    if (!isNewSession && !isValidSessionId) {
      console.log('[Index] Invalid session ID, redirecting to new chat');
      toast({
        title: "Invalid Session",
        description: "The requested chat session could not be found.",
        variant: "destructive"
      });
      navigate('/c/new');
      return;
    }

    if (templateId && !isValidTemplateId) {
      console.log('[Index] Invalid template ID:', templateId);
      toast({
        title: "Invalid Template",
        description: "The requested template could not be found.",
        variant: "destructive"
      });
    }

    if (patientId && !isValidPatientId) {
      console.log('[Index] Invalid patient ID:', patientId);
      toast({
        title: "Invalid Patient",
        description: "The requested patient could not be found.",
        variant: "destructive"
      });
    }
  }, [
    isNewSession, 
    isValidSessionId, 
    templateId, 
    isValidTemplateId, 
    patientId, 
    isValidPatientId, 
    navigate,
    toast
  ]);

  console.log('[Index] Rendering with params:', { 
    sessionId, 
    templateId, 
    patientId,
    messagesCount: messages.length 
  });

  const handleTemplateChange = useCallback((template: any) => {
    console.log('[Index] Template changed:', template);
    setSelectedTemplate(template);
    
    // Update URL with new template
    const searchParams = new URLSearchParams();
    if (template?.id) searchParams.set('template', template.id);
    if (patientId) searchParams.set('patient', patientId);
    
    navigate({
      pathname: sessionId ? `/c/${sessionId}` : '/c/new',
      search: searchParams.toString()
    });
  }, [navigate, sessionId, patientId]); 

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] relative">
      <ChatHeader 
        isSidebarOpen={isOpen}
        onTemplateChange={handleTemplateChange}
      />
      
      <div className="flex-1 overflow-hidden mt-[60px] relative">
        <div className="max-w-3xl mx-auto px-4 h-full">
          <MessageList messages={messages} />
        </div>
      </div>
      
      <div className="w-full pb-4 pt-2 fixed bottom-0 left-0 right-0 bg-chatgpt-main/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4">
          <ChatInput 
            onSend={handleSendMessage}
            onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return <ChatContent />;
};

export default Index;