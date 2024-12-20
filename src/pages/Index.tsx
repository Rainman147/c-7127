import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useTemplateState } from '@/hooks/useTemplateState';
import { useTranscriptionHandler } from '@/hooks/useTranscriptionHandler';
import { useMessageHandler } from '@/hooks/useMessageHandler';

/**
 * Index Component
 * 
 * Main chat interface that combines sidebar navigation with chat functionality.
 * Handles template selection, audio transcription, and message management.
 */
const Index = () => {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Core Hooks
  const { session } = useSessionManagement();
  const { messages, isLoading, loadChatMessages, currentChatId } = useChat();
  const { currentTemplate, handleTemplateChange } = useTemplateState();
  const { handleTranscriptionComplete } = useTranscriptionHandler();
  const { handleMessageSend } = useMessageHandler();
  
  // Initialize audio recovery
  useAudioRecovery();

  // Session Management
  const handleSessionSelect = async (chatId: string) => {
    console.log('[Index] Selecting session:', chatId);
    await loadChatMessages(chatId);
  };

  // Message Handling
  const handleMessage = async (message: string, type: 'text' | 'audio' = 'text') => {
    await handleMessageSend(message, type, currentTemplate);
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onApiKeyChange={() => {}} 
        onSessionSelect={handleSessionSelect}
      />
      
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        currentChatId={currentChatId}
        onMessageSend={handleMessage}
        onTemplateChange={handleTemplateChange}
        onTranscriptionComplete={handleTranscriptionComplete}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
};

export default Index;