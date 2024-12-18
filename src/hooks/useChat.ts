import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Authentication error:', error);
        navigate('/auth');
      }
    };
    
    checkAuth();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [navigate]);

  const saveMessageToSupabase = async (message: Message, chatId?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        navigate('/auth');
        return;
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

        if (chatError) {
          console.error('Error creating chat:', chatError);
          throw chatError;
        }
        chatId = chatData.id;
        setCurrentChatId(chatId);
      }

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: message.content,
          sender: message.role,
          type: message.type || 'text'
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error saving message:', messageError);
        throw messageError;
      }
      
      console.log('Message saved successfully:', messageData);
      return { chatId, messageId: messageData.id };
    } catch (error: any) {
      console.error('Error in saveMessageToSupabase:', error);
      toast({
        title: "Error",
        description: "Failed to save message. Please try again.",
        variant: "destructive"
      });
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
    console.log('Sending message:', { content, type, systemInstructions });

    try {
      const userMessage: Message = { role: 'user', content, type };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Save message to Supabase
      const { chatId, messageId } = await saveMessageToSupabase(userMessage, currentChatId);
      userMessage.id = messageId;
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
        console.error('Error from Gemini function:', error);
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
        
        // Save assistant message to Supabase
        const { messageId: assistantMessageId } = await saveMessageToSupabase(finalAssistantMessage, chatId);
        finalAssistantMessage.id = assistantMessageId;
        
        setMessages(prev => [...prev.slice(0, -1), finalAssistantMessage]);
        console.log('Assistant message saved successfully');
      }

    } catch (error: any) {
      console.error('Error in handleSendMessage:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
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