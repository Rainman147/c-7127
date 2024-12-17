import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useChatSessions } from '@/hooks/useChatSessions';
import type { Template } from '@/components/template/types';
import type { ModelType } from '@/components/chat/ModelSelector';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelType>('gemini');
  
  const { session } = useSessionManagement();
  const { createSession } = useChatSessions();
  
  const { 
    messages, 
    isLoading, 
    handleSendMessage, 
    setMessages,
    currentChatId,
    setCurrentChatId
  } = useChat();

  // Initialize audio recovery
  useAudioRecovery();

  const handleSessionSelect = async (chatId: string) => {
    setCurrentChatId(chatId);
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(messages.map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: msg.content,
        type: msg.type as 'text' | 'audio'
      })));
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleTemplateChange = (template: Template) => {
    console.log('Template changed:', template);
    setCurrentTemplate(template);
  };

  const handleModelChange = (model: ModelType) => {
    console.log('Model changed:', model);
    setCurrentModel(model);
  };

  const handleTranscriptionComplete = async (text: string) => {
    console.log('Transcription complete in Index, ready for user to edit:', text);
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
    // Create a new session only when sending the first message
    if (!currentChatId) {
      console.log('Creating new session for first message');
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('Created new session:', sessionId);
        setCurrentChatId(sessionId);
        // Wait a brief moment for the session to be properly created
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await handleSendMessage(
      message, 
      type,
      currentModel,
      currentTemplate?.systemInstructions
    );
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
        onMessageSend={handleMessageSend}
        onTemplateChange={handleTemplateChange}
        onTranscriptionComplete={handleTranscriptionComplete}
        isSidebarOpen={isSidebarOpen}
        currentModel={currentModel}
        onModelChange={handleModelChange}
      />
    </div>
  );
};

export default Index;