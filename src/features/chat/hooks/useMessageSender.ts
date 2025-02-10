
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types';
import { sortMessages } from '../utils/messageSort';

export const useMessageSender = (
  sessionId: string | undefined,
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
  setIsLoading: (value: boolean) => void,
  messages: Message[]
) => {
  const { toast } = useToast();

  const handleMessageSend = async (content: string, type: 'text' | 'audio' = 'text', directMode = false) => {
    console.log('[MessageSender] Sending message:', { content, type, directMode });
    
    if (!sessionId || !supabase.auth.getSession()) {
      console.error('No active session or user');
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
      const endpoint = directMode ? 'direct-chat' : 'chat-manager';
      console.log('[MessageSender] Using endpoint:', endpoint);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: {
          chatId: sessionId,
          content,
          type,
          metadata: { 
            tempId,
            sortIndex: messages.length
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        setMessages(prev => prev.map(m => 
          m.metadata?.tempId === tempId
            ? { ...m, status: 'error' }
            : m
        ));
        throw error;
      }

      console.log('Message sent successfully:', data);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again. If the problem persists, check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return handleMessageSend;
};
