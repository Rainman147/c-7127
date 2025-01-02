import { useState } from 'react';
import ChatContainer from '@/features/chat/components/container/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { getDefaultTemplate } from '@/utils/template/templateStateManager';
import type { Template } from '@/components/template/types';

const Index = () => {
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

  const handleSessionSelect = async (chatId: string) => {
    console.log('[Index] Selecting session:', chatId);
    await loadChatMessages(chatId);
  };

  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed to:', template.name);
    setCurrentTemplate(template);
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