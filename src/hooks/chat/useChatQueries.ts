import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { messageKeys, sessionKeys } from '@/types/chat';
import type { Message, ChatSession } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

// Fetch messages for a chat
export const useMessages = (chatId: string | null) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: chatId ? messageKeys.chat(chatId) : null,
    queryFn: async () => {
      console.log('[useMessages] Fetching messages for chat:', chatId);
      if (!chatId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('[useMessages] Error fetching messages:', error);
        toast({
          title: "Error loading messages",
          description: "Failed to load chat messages. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!chatId,
  });
};

// Fetch chat session details
export const useChatSession = (sessionId: string | null) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: sessionId ? sessionKeys.detail(sessionId) : null,
    queryFn: async () => {
      console.log('[useChatSession] Fetching session:', sessionId);
      if (!sessionId) return null;
      
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
        
      if (error) {
        console.error('[useChatSession] Error fetching session:', error);
        toast({
          title: "Error loading chat session",
          description: "Failed to load chat details. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data;
    },
    gcTime: 1000 * 60 * 60, // 1 hour
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!sessionId,
  });
};

// Send message mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ content, chatId, type = 'text' }: { 
      content: string;
      chatId: string;
      type?: 'text' | 'audio';
    }) => {
      console.log('[useSendMessage] Sending message:', { content, chatId, type });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          chat_id: chatId,
          type,
          sender: 'user',
        })
        .select()
        .single();
        
      if (error) {
        console.error('[useSendMessage] Error sending message:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('[useSendMessage] Message sent successfully:', data);
      // Invalidate and refetch messages for this chat
      queryClient.invalidateQueries({
        queryKey: messageKeys.chat(variables.chatId),
      });
    },
    onError: (error) => {
      console.error('[useSendMessage] Error in mutation:', error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });
};