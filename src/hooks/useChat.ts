import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadChatMessages = async (chatId: string) => {
    try {
      console.log('[useChat] Loading messages for chat:', chatId);
      
      // First, fetch all messages for this chat
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Then, fetch all edited versions of these messages
      const messageIds = messages.map(m => m.id);
      const { data: editedMessages, error: editsError } = await supabase
        .from('edited_messages')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: false });  // Get latest edit first

      if (editsError) throw editsError;

      // Create a map of message_id to latest edited content
      const editedContentMap = editedMessages.reduce((acc: Record<string, string>, edit) => {
        if (!acc[edit.message_id]) {
          acc[edit.message_id] = edit.edited_content;
        }
        return acc;
      }, {});

      // Apply edits to messages
      const processedMessages = messages.map(msg => ({
        role: msg.sender as 'user' | 'assistant',
        content: editedContentMap[msg.id] || msg.content, // Use edited content if available
        type: msg.type as 'text' | 'audio',
        id: msg.id
      }));

      console.log('[useChat] Processed messages:', processedMessages.length);
      setMessages(processedMessages);
      setCurrentChatId(chatId);

    } catch (error: any) {
      console.error('[useChat] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    }
  };

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

      if (messageError) throw messageError;
      return { chatId, messageId: messageData.id };
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
    handleSendMessage,
    loadChatMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};