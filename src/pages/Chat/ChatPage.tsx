import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const ChatPage = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const { 
    messages, 
    isLoading, 
    currentChatId, 
    handleSendMessage,
    loadChatMessages,
    setCurrentChatId
  } = useChat();

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Effect to load messages when sessionId changes
  useEffect(() => {
    console.log('[ChatPage] Session ID from URL:', sessionId);
    
    if (sessionId) {
      console.log('[ChatPage] Loading messages for session:', sessionId);
      
      loadChatMessages(sessionId).catch((error) => {
        console.error('[ChatPage] Error loading messages:', error);
        toast({
          title: "Error loading chat",
          description: "Failed to load chat messages. Please try again.",
          variant: "destructive",
        });
      });
      
      // Update current chat ID to match URL
      setCurrentChatId(sessionId);
    }
  }, [sessionId, loadChatMessages, setCurrentChatId, toast]);

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[ChatPage] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
  };

  return (
    <ChatContainer 
      messages={messages}
      isLoading={isLoading}
      currentChatId={currentChatId}
      onMessageSend={handleSendMessage}
      onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
      onTemplateChange={() => {}}
      onPatientSelect={handlePatientSelect}
      selectedPatientId={selectedPatientId}
    />
  );
};

export default ChatPage;