import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
};

export const useChat = () => {
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
      // First check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to send messages');
      }

      const userMessage: Message = { role: 'user', content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Create a new chat if this is the first message
      if (messages.length === 0) {
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            title: content.substring(0, 50),
            user_id: user.id // Using the authenticated user's ID
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

      // Call Gemini function
      const response = await supabase.functions.invoke('gemini', {
        body: { messages: newMessages }
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
      } catch (error: any) {
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

  return {
    messages,
    isLoading,
    handleSendMessage
  };
};