import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useState } from 'react';

const ChatPage = () => {
  const { 
    messages, 
    isLoading, 
    currentChatId, 
    handleSendMessage,
    loadChatMessages
  } = useChat();

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handlePatientSelect = async (patientId: string | null) => {
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