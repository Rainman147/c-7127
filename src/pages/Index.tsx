import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ProfileMenu } from '@/components/header/ProfileMenu';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import type { Template } from '@/components/template/types';

/**
 * Main chat interface page component
 * Handles chat session management, message display, and user interactions
 */
const Index = () => {
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const { isOpen, open } = useSidebar();
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

  /**
   * Handles selection of a chat session
   * @param chatId - The ID of the selected chat
   */
  const handleSessionSelect = async (chatId: string) => {
    console.log('[Index] Selecting session:', chatId);
    setCurrentChatId(chatId);
    await loadChatMessages(chatId);
  };

  /**
   * Handles template selection changes
   * @param template - The selected template
   */
  const handleTemplateChange = (template: Template) => {
    console.log('[Index] Template changed to:', template.name);
    setCurrentTemplate(template);
  };

  /**
   * Handles completion of audio transcription
   * @param text - The transcribed text
   */
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

  /**
   * Handles sending a new message
   * @param message - The message content
   * @param type - The message type (text or audio)
   */
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={open}
            variant="ghost"
            size="icon"
            className={cn(
              "transition-all duration-300 ease-in-out text-white/70 hover:text-white fixed",
              isOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
              "z-50"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <TemplateSelector 
            currentChatId={currentChatId} 
            onTemplateChange={handleTemplateChange}
          />
        </div>
        <ProfileMenu profilePhotoUrl={session?.user?.user_metadata?.avatar_url} />
      </div>

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