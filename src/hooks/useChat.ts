import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const saveMessageToSupabase = async (message: Message, chatId?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to send messages');
      }

      if (!chatId) {
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            title: message.content.substring(0, 50),
            user_id: user.id
          })
          .select()
          .single();

        if (chatError) throw chatError;
        chatId = chatData.id;
        setCurrentChatId(chatId);
      }

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: message.content,
          sender: message.role,
          type: message.type || 'text'
        });

      if (messageError) throw messageError;
      return chatId;
    } catch (error: any) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string, type: 'text' | 'audio' = 'text', systemInstructions?: string) => {
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
      const userMessage: Message = { role: 'user', content, type };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Save message to Supabase
      const chatId = await saveMessageToSupabase(userMessage, currentChatId);
      setCurrentChatId(chatId);

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

      // Call Gemini function with system instructions
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: { 
          messages: newMessages,
          systemInstructions: systemInstructions 
        }
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No response from Gemini API');
      }

      // Update the assistant message with the response
      if (data.content) {
        const finalAssistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          isStreaming: false
        };
        setMessages(prev => [...prev.slice(0, -1), finalAssistantMessage]);
        await saveMessageToSupabase(finalAssistantMessage, chatId);
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

  const handleTranscriptionError = () => {
    const errorMessage: Message = {
      role: 'user',
      content: 'Error processing audio transcription.',
      type: 'audio'
    };
    setMessages(prev => [...prev, errorMessage]);
  };

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleTranscriptionError,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};