import ChatContainer from '@/features/chat/components/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useState } from 'react';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

const ChatPage = () => {
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(() => {
    const defaultTemplate = getDefaultTemplate();
    console.log('[ChatPage] Initializing with default template:', defaultTemplate.name);
    return defaultTemplate;
  });

  const { 
    messages, 
    isLoading, 
    currentChatId, 
    handleSendMessage,
  } = useChat();

  const handleTemplateChange = (template: Template) => {
    console.log('[ChatPage] Template changed to:', template.name);
    setCurrentTemplate(template);
  };

  return (
    <ChatContainer 
      messages={messages}
      isLoading={isLoading}
      currentChatId={currentChatId}
      onMessageSend={handleSendMessage}
      onTemplateChange={handleTemplateChange}
      onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
    />
  );
};

export default ChatPage;