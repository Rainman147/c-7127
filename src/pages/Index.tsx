import { useState } from 'react';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ProfileMenu } from '@/components/header/ProfileMenu';
import type { Template } from '@/components/template/types';

const Index = () => {
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  
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
      console.log('[Index] Creating new session for first message');
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('[Index] Created new session:', sessionId);
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
    <div className="flex flex-col h-full">
      {/* Header section with TemplateSelector and ProfileMenu */}
      <div className="flex justify-between items-center px-4 py-2 bg-chatgpt-main/95 backdrop-blur">
        <TemplateSelector 
          currentChatId={currentChatId} 
          onTemplateChange={handleTemplateChange}
        />
        <ProfileMenu profilePhotoUrl={session?.user?.user_metadata?.avatar_url} />
      </div>

      {/* Chat container */}
      <div className="flex-1">
        <ChatContainer 
          messages={messages}
          isLoading={isLoading}
          currentChatId={currentChatId}
          onMessageSend={handleMessageSend}
          onTemplateChange={handleTemplateChange}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      </div>
    </div>
  );
};

export default Index;