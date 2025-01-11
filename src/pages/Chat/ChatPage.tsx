import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useTemplateManagement } from './hooks/useTemplateManagement';
import { usePatientManagement } from './hooks/usePatientManagement';
import { useTranscriptionHandler } from './hooks/useTranscriptionHandler';
import { useChatSessions } from '@/hooks/useChatSessions';
import type { Template } from '@/types';

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { createSession } = useChatSessions();
  
  const { 
    messages, 
    isLoading: isChatLoading, 
    error: chatError,
    handleSendMessage,
    loadChatMessages,
    currentChatId,
    setCurrentChatId
  } = useChat();

  const {
    selectedTemplate,
    handleTemplateChange,
    isTemplateLoading,
    templateError
  } = useTemplateManagement();

  const {
    selectedPatientId,
    handlePatientSelect
  } = usePatientManagement();

  const {
    handleTranscriptionComplete
  } = useTranscriptionHandler();

  const handleSessionSelect = async (chatId: string) => {
    console.log('[ChatPage] Selecting session:', chatId);
    const currentParams = new URLSearchParams(location.search);
    navigate(`/c/${chatId}?${currentParams.toString()}`);
    await loadChatMessages({ throwOnError: true });
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
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await handleSendMessage(
      message, 
      type, 
      selectedTemplate?.systemInstructions
    );
  };

  const isLoading = isChatLoading || isTemplateLoading;
  const error = chatError || templateError;

  return (
    <div className="flex h-screen">
      {templateError && (
        <Alert variant="destructive" className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-96">
          <AlertTitle>Template Error</AlertTitle>
          <AlertDescription>{templateError.message}</AlertDescription>
        </Alert>
      )}
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        currentChatId={currentChatId}
        onMessageSend={handleMessageSend}
        onTemplateChange={handleTemplateChange}
        onPatientSelect={handlePatientSelect}
        selectedPatientId={selectedPatientId}
        error={error}
        onTranscriptionComplete={handleTranscriptionComplete}
      />
    </div>
  );
};

export default ChatPage;