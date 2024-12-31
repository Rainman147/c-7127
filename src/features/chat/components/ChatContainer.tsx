import { useState } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { ChatHeader } from '@/components/ChatHeader';
import { useUI } from '@/contexts/UIContext';
import type { Message } from '@/types/chat';
import type { Template } from '@/components/template/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (message: string, type?: 'text' | 'audio') => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onTranscriptionComplete: (text: string) => void;
}

const ChatContainer = ({
  messages,
  isLoading,
  currentChatId,
  onMessageSend,
  onTemplateChange,
  onTranscriptionComplete,
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages);
  const { isSidebarOpen } = useUI();
  
  return (
    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
      <ChatHeader 
        currentChatId={currentChatId}
        onTemplateChange={onTemplateChange}
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