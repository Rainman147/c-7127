import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/ChatHeader';
import MessageList from '@/components/MessageList';
import ChatInput from '@/components/ChatInput';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { TwoLineMenuIcon } from '@/components/icons/TwoLineMenuIcon';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const ChatContent = () => {
  const { isOpen, open } = useSidebar();
  const { messages, isLoading, handleSendMessage, currentChatId } = useChat();
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateChange = (template: any) => {
    console.log('[Index] Template changed:', template);
    setSelectedTemplate(template);
  };

  return (
    <main className="flex h-full flex-col">
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
        <TwoLineMenuIcon className="h-5 w-5" />
      </Button>
      
      <ChatHeader 
        currentChatId={currentChatId}
        onTemplateChange={handleTemplateChange}
      />
      
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      
      <div className="pb-4 pt-2">
        <ChatInput 
          onSend={handleSendMessage}
          onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
};

const Index = () => {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
};

export default Index;