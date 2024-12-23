import { useState, useCallback, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/ChatHeader';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import { useSidebar } from '@/contexts/SidebarContext';
import { SidebarToggle } from '@/components/SidebarToggle';
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
    isNewSession,
    isValidSessionId
  } = useSessionParams();
  
  const { messages, isLoading, handleSendMessage } = useChat(isValidSessionId ? sessionId : null);

  // Handle invalid routes
  useEffect(() => {
    if (!isNewSession && !isValidSessionId) {
      console.log('[Index] Invalid session ID, redirecting to new chat');
      toast({
        title: "Invalid Session",
        description: "The requested chat session could not be found.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isNewSession, isValidSessionId, navigate, toast]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] relative">
      <SidebarToggle />
      <ChatHeader isSidebarOpen={isOpen} />
      
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