import { useState, useEffect, useRef } from 'react';
import { useMessageHandling } from './chat/useMessageHandling';
import { useMessagePersistence } from './chat/useMessagePersistence';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';

type MessageCache = {
  [chatId: string]: {
    messages: Message[];
    lastFetched: number;
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MESSAGES_PER_BATCH = 50;

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messageCache = useRef<MessageCache>({});
  const { toast } = useToast();
  
  const { isLoading, handleSendMessage: sendMessage } = useMessageHandling();
  const { loadChatMessages } = useMessagePersistence();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentChatId) return;

    console.log('[useChat] Setting up real-time subscription for chat:', currentChatId);
    
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        async (payload) => {
          console.log('[useChat] Received real-time update:', payload);
          
          try {
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              setMessages(prev => [...prev, newMessage]);
              
              // Update cache
              if (messageCache.current[currentChatId]) {
                messageCache.current[currentChatId].messages.push(newMessage);
                messageCache.current[currentChatId].lastFetched = Date.now();
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                )
              );
              
              // Update cache
              if (messageCache.current[currentChatId]) {
                messageCache.current[currentChatId].messages = 
                  messageCache.current[currentChatId].messages.map(msg =>
                    msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                  );
              }
            }
          } catch (error) {
            console.error('[useChat] Error handling real-time update:', error);
            toast({
              title: "Error",
              description: "Failed to process message update",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useChat] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentChatId, toast]);

  // Load messages when chat ID changes
  useEffect(() => {
    if (!currentChatId) {
      console.log('[useChat] No current chat ID, clearing messages');
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      console.log('[useChat] Current chat ID changed, checking cache:', currentChatId);
      
      // Check cache first
      const cachedData = messageCache.current[currentChatId];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.lastFetched) < CACHE_DURATION) {
        console.log('[useChat] Using cached messages for chat:', currentChatId);
        setMessages(cachedData.messages);
        return;
      }

      try {
        console.log('[useChat] Cache miss or expired, loading messages from DB');
        const loadedMessages = await loadChatMessages(currentChatId, MESSAGES_PER_BATCH);
        console.log('[useChat] Messages loaded:', loadedMessages.length);
        
        // Update cache
        messageCache.current[currentChatId] = {
          messages: loadedMessages,
          lastFetched: now
        };
        
        setMessages(loadedMessages);
      } catch (error) {
        console.error('[useChat] Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
        setMessages([]);
      }
    };

    loadMessages();
  }, [currentChatId, loadChatMessages, toast]);

  const handleLoadChatMessages = async (chatId: string) => {
    console.log('[useChat] Loading messages for chat:', chatId);
    try {
      const loadedMessages = await loadChatMessages(chatId);
      setMessages(loadedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('[useChat] Error loading chat messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    }
  };

  const loadMoreMessages = async () => {
    if (!currentChatId || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      console.log('[useChat] Loading more messages, current count:', messages.length);
      
      const olderMessages = await loadChatMessages(
        currentChatId, 
        MESSAGES_PER_BATCH, 
        messages.length
      );

      if (olderMessages.length > 0) {
        const updatedMessages = [...messages, ...olderMessages];
        setMessages(updatedMessages);
        
        // Update cache
        messageCache.current[currentChatId] = {
          messages: updatedMessages,
          lastFetched: Date.now()
        };
      }
    } catch (error) {
      console.error('[useChat] Error loading more messages:', error);
      toast({
        title: "Error",
        description: "Failed to load more messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (
    content: string, 
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useChat] Sending message:', { content, type, systemInstructions });
    
    try {
      const result = await sendMessage(
        content,
        type,
        systemInstructions,
        messages,
        currentChatId
      );

      console.log('[useChat] Message send result:', result);

      if (result) {
        setMessages(result.messages);
        setCurrentChatId(result.chatId);
        
        // Update cache with new message
        messageCache.current[result.chatId] = {
          messages: result.messages,
          lastFetched: Date.now()
        };
      }
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMore,
    handleSendMessage,
    loadChatMessages: handleLoadChatMessages,
    loadMoreMessages,
    setMessages,
    currentChatId,
    setCurrentChatId
  };
};