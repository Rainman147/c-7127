import { useChatSessions } from '@/hooks/useChatSessions';
import { useChat } from '@/hooks/useChat';
import type { Template } from '@/components/template/types';

export const useMessageHandler = () => {
  const { createSession } = useChatSessions();
  const { 
    handleSendMessage,
    currentChatId,
    setCurrentChatId,
  } = useChat();

  const handleMessageSend = async (
    message: string, 
    type: 'text' | 'audio' = 'text',
    currentTemplate: Template | null
  ) => {
    if (!currentChatId) {
      console.log('[useMessageHandler] Creating new session for first message');
      const sessionId = await createSession('New Chat');
      if (sessionId) {
        console.log('[useMessageHandler] Created new session:', sessionId);
        setCurrentChatId(sessionId);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await handleSendMessage(
      message, 
      type, 
      currentTemplate?.systemInstructions
    );
  };

  return { handleMessageSend };
};