
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/AuthContext';
import type { Message } from '@/types';
import { sortMessages } from '../utils/messageSort';

export const useMessageSender = (
  sessionId: string | undefined,
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  setIsLoading: (value: boolean) => void,
  messages: Message[],
  persistSession?: (sessionId: string) => Promise<any>
) => {
  const { toast } = useToast();
  const { session: authSession } = useAuth();

  const handleMessageSend = async (content: string, type: 'text' | 'audio' = 'text', directMode = false) => {
    console.log('[MessageSender] Sending message:', { content, type, directMode });
    
    if (!sessionId) {
      console.error('[MessageSender] No active session');
      return;
    }

    if (!authSession?.access_token) {
      console.error('[MessageSender] No auth session or access token');
      toast({
        title: "Authentication Error",
        description: "Please sign in again to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const tempId = uuidv4();
    const now = new Date().toISOString();
    const optimisticMessage: Message = {
      chatId: sessionId,
      content,
      type,
      role: 'user',
      status: 'pending',
      metadata: {
        tempId,
        isOptimistic: true,
        sortIndex: messages.length
      },
      createdAt: now,
    };

    setMessages(prev => sortMessages([...prev, optimisticMessage]));

    try {
      let actualChatId = sessionId;

      const isTemporarySession = !sessionId.includes('-');
      if (isTemporarySession && persistSession) {
        console.log('[MessageSender] Persisting temporary chat session:', sessionId);
        const persistedChat = await persistSession(sessionId);
        if (persistedChat) {
          console.log('[MessageSender] Chat session persisted:', persistedChat.id);
          optimisticMessage.chatId = persistedChat.id;
          actualChatId = persistedChat.id;
        } else {
          throw new Error('Failed to persist temporary chat session');
        }
      } else {
        console.log('[MessageSender] Using existing chat session:', sessionId);
      }

      const endpoint = directMode ? 'direct-chat' : 'chat-manager';
      console.log('[MessageSender] Using endpoint:', endpoint, { 
        directMode,
        chatId: actualChatId
      });

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: {
          chatId: actualChatId,
          content,
          type,
          metadata: { 
            tempId,
            sortIndex: messages.length
          }
        },
        headers: {
          Authorization: `Bearer ${authSession.access_token}`
        }
      });

      if (error) {
        console.error('[MessageSender] Error from edge function:', error);
        // Update optimistic message to show error
        setMessages(prev => prev.map(m => 
          m.metadata?.tempId === tempId
            ? { ...m, status: 'error' }
            : m
        ));
        throw error;
      }

      console.log('[MessageSender] Message sent successfully:', data);

    } catch (error) {
      console.error('[MessageSender] Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again. If the problem persists, try signing out and back in.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return handleMessageSend;
};

