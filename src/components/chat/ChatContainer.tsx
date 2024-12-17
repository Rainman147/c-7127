import { useState } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import MessageList from '@/components/MessageList';
import type { Template } from '@/components/template/types';

interface ChatContainerProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string; type?: 'text' | 'audio' }>;
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (message: string, type?: 'text' | 'audio') => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onTranscriptionComplete: (text: string) => void;
  isSidebarOpen: boolean;
  onNewChat?: () => void;
  onToggleSidebar: () => void;
}

const ChatContainer = ({
  messages,
  isLoading,
  currentChatId,
  onMessageSend,
  onTemplateChange,
  onTranscriptionComplete,
  isSidebarOpen,
  onNewChat,
  onToggleSidebar
}: ChatContainerProps) => {
  return (
    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
      <ChatHeader 
        isSidebarOpen={isSidebarOpen}
        currentChatId={currentChatId}
        onTemplateChange={onTemplateChange}
        onNewChat={onNewChat}
        onToggleSidebar={onToggleSidebar}
      />
      
      <div className={`flex h-full flex-col ${messages.length === 0 ? 'items-center justify-center' : 'justify-between'} pt-[60px] pb-4`}>
        {messages.length === 0 ? (
          <div className="w-full max-w-3xl px-4 space-y-4">
            <div>
              <h1 className="mb-8 text-4xl font-semibold text-center">What can I help with?</h1>
              <ChatInput 
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                isLoading={isLoading} 
              />
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div className="w-full max-w-3xl mx-auto px-4 py-2">
              <ChatInput 
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                isLoading={isLoading} 
              />
            </div>
            <div className="text-xs text-center text-gray-500 py-2">
              ChatGPT can make mistakes. Check important info.
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ChatContainer;