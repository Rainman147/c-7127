import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ActionButtons from '@/components/ActionButtons';
import MessageList from '@/components/MessageList';
import { useChat } from '@/hooks/useChat';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { messages, isLoading, handleSendMessage } = useChat();

  const handleTranscriptionUpdate = (text: string) => {
    setMessages(prevMessages => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      
      // If the last message is a streaming transcription, update it
      if (lastMessage?.isStreaming) {
        return [
          ...prevMessages.slice(0, -1),
          { ...lastMessage, content: text }
        ];
      }
      
      // Otherwise, add a new streaming message
      return [
        ...prevMessages,
        { role: 'user', content: text, isStreaming: true }
      ];
    });
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onApiKeyChange={() => {}} 
      />
      
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <ChatHeader isSidebarOpen={isSidebarOpen} />
        
        <div className={`flex h-full flex-col ${messages.length === 0 ? 'items-center justify-center' : 'justify-between'} pt-[60px] pb-4`}>
          {messages.length === 0 ? (
            <div className="w-full max-w-3xl px-4 space-y-4">
              <div>
                <h1 className="mb-8 text-4xl font-semibold text-center">What can I help with?</h1>
                <ChatInput 
                  onSend={handleSendMessage} 
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  isLoading={isLoading} 
                />
              </div>
              <ActionButtons />
            </div>
          ) : (
            <>
              <MessageList messages={messages} />
              <div className="w-full max-w-3xl mx-auto px-4 py-2">
                <ChatInput 
                  onSend={handleSendMessage} 
                  onTranscriptionUpdate={handleTranscriptionUpdate}
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
    </div>
  );
};

export default Index;
