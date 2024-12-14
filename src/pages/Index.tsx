import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ActionButtons from '@/components/ActionButtons';
import MessageList from '@/components/MessageList';
import { supabase } from '@/integrations/supabase/client';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  speaker?: 'Physician' | 'Patient';
  timestamp?: string;
  confidence?: number;
};

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Subscribe to real-time transcription updates
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert([{ title: 'New Chat' }])
        .select()
        .single();

      if (chatError) throw chatError;

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([{
          chat_id: chat.id,
          content,
          role: 'user',
          type: 'text'
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      setMessages((prev) => [...prev, message as Message]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: newContent } : msg
        )
      );
    } catch (error: any) {
      console.error('Error updating message:', error);
      throw error;
    }
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
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
              </div>
              <ActionButtons />
            </div>
          ) : (
            <>
              <MessageList 
                messages={messages} 
                onEditMessage={handleEditMessage}
              />
              <div className="w-full max-w-3xl mx-auto px-4 py-2">
                <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
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