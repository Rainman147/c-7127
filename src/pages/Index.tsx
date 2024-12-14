import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import ChatHeader from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import ActionButtons from '@/components/ActionButtons';
import MessageList from '@/components/MessageList';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
      const userMessage: Message = { role: 'user', content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Create a new chat if this is the first message
      if (messages.length === 0) {
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            title: content.substring(0, 50),
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (chatError) throw chatError;

        // Insert the message
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            chat_id: chatData.id,
            content: content,
            sender: 'user',
            type: 'text'
          });

        if (messageError) throw messageError;
      }

      // Cancel any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this stream
      abortControllerRef.current = new AbortController();

      // Add initial assistant message for streaming
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        isStreaming: true
      };
      setMessages([...newMessages, assistantMessage]);

      // Call Gemini function with streaming
      const response = await supabase.functions.invoke('gemini', {
        body: { messages: newMessages },
        signal: abortControllerRef.current.signal
      });

      if (!response.data) {
        throw new Error('No response from Gemini API');
      }

      // Handle streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.content) {
                  fullContent += data.content;
                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMessage, content: fullContent }
                      ];
                    }
                    return prev;
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          throw error;
        }
      } finally {
        // Update final message state
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: fullContent || 'Error: No response generated', isStreaming: false }
            ];
          }
          return prev;
        });
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      
      // Remove the streaming message if there was an error
      setMessages(prev => prev.filter(msg => !msg.isStreaming));
    } finally {
      setIsLoading(false);
    }
  };

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