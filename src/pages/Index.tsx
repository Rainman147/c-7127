import { useState, useCallback, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/ChatHeader';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { TwoLineMenuIcon } from '@/components/icons/TwoLineMenuIcon';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { useSessionParams } from '@/hooks/routing/useSessionParams';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ChatContent = () => {
  const { isOpen, open } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sessionId, 
    templateId, 
    patientId, 
    isNewSession,
    isValidSessionId,
    isValidTemplateId,
    isValidPatientId,
    redirectToNew 
  } = useSessionParams();
  
  const { messages, isLoading, handleSendMessage } = useChat(sessionId);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Handle invalid routes - now properly checks for new session
  useEffect(() => {
    if (!isNewSession && !isValidSessionId) {
      console.log('[Index] Invalid session ID detected, redirecting to new chat');
      redirectToNew();
      toast({
        title: "Starting New Chat",
        description: "Creating a new chat session for you.",
        variant: "default"
      });
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
    redirectToNew,
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
      <Button
        onClick={open}
        variant="ghost"
        size="icon"
        className={cn(
          "transition-all duration-300 ease-in-out text-white/70 hover:text-white fixed",
          isOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
          "z-50 left-4 top-3"
        )}
      >
        <TwoLineMenuIcon className="h-5 w-5" />
      </Button>
      
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