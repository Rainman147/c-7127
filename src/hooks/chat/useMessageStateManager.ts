import { useState, useCallback } from 'react';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageStateManager = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [confirmedMessages, setConfirmedMessages] = useState<Message[]>([]);
  const [failedMessages, setFailedMessages] = useState<Message[]>([]);

  const updateMessageStates = useCallback((
    message: Message,
    type: 'add' | 'confirm' | 'fail' | 'remove'
  ) => {
    logger.debug(LogCategory.STATE, 'MessageStateManager', `Updating message states: ${type}`, {
      messageId: message.id,
      type,
      currentStates: {
        messages: messages.length,
        pending: pendingMessages.length,
        confirmed: confirmedMessages.length,
        failed: failedMessages.length
      }
    });

    switch (type) {
      case 'add':
        setMessages(prev => [...prev, message]);
        setPendingMessages(prev => [...prev, message]);
        break;
      case 'confirm':
        setMessages(prev => 
          prev.map(msg => msg.id === message.id ? message : msg)
        );
        setPendingMessages(prev => prev.filter(msg => msg.id !== message.id));
        setConfirmedMessages(prev => [...prev, message]);
        break;
      case 'fail':
        setPendingMessages(prev => prev.filter(msg => msg.id !== message.id));
        setFailedMessages(prev => [...prev, message]);
        break;
      case 'remove':
        setFailedMessages(prev => prev.filter(msg => msg.id !== message.id));
        break;
    }
  }, [messages, pendingMessages, confirmedMessages, failedMessages]);

  return {
    messages,
    pendingMessages,
    confirmedMessages,
    failedMessages,
    updateMessageStates
  };
};