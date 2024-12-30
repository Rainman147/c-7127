import { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

export const mergeMessages = (
  localMessages: Message[],
  serverMessages: Message[],
  optimisticMessages: Message[] = []
): Message[] => {
  logger.debug(LogCategory.STATE, 'messageUtils', 'Merging messages:', {
    localCount: localMessages.length,
    serverCount: serverMessages.length,
    optimisticCount: optimisticMessages.length
  });

  // Create a map of existing messages by ID
  const messageMap = new Map<string, Message>();
  
  // Add all local messages first
  localMessages.forEach(msg => {
    if (!msg.isOptimistic) {
      messageMap.set(msg.id, msg);
    }
  });

  // Add server messages, preserving local state for matching IDs
  serverMessages.forEach(msg => {
    const existingMsg = messageMap.get(msg.id);
    if (existingMsg) {
      // Preserve local state properties while updating with server data
      messageMap.set(msg.id, {
        ...msg,
        status: existingMsg.status === 'error' ? 'error' : msg.status,
        isEditing: existingMsg.isEditing,
        wasEdited: existingMsg.wasEdited
      });
    } else {
      messageMap.set(msg.id, msg);
    }
  });

  // Add optimistic messages that haven't been confirmed yet
  optimisticMessages.forEach(msg => {
    if (!messageMap.has(msg.id)) {
      messageMap.set(msg.id, msg);
    }
  });

  // Convert back to array and sort by sequence/timestamp
  const mergedMessages = Array.from(messageMap.values()).sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  logger.debug(LogCategory.STATE, 'messageUtils', 'Merge complete:', {
    mergedCount: mergedMessages.length,
    messageIds: mergedMessages.map(m => m.id)
  });

  return mergedMessages;
};

export const validateMessageSequence = (messages: Message[]): boolean => {
  let isValid = true;
  let lastSequence = -1;

  messages.forEach((msg, index) => {
    if (msg.sequence !== undefined && msg.sequence < lastSequence) {
      logger.error(LogCategory.VALIDATION, 'messageUtils', 'Invalid message sequence:', {
        messageId: msg.id,
        currentSequence: msg.sequence,
        lastSequence,
        index
      });
      isValid = false;
    }
    lastSequence = msg.sequence || lastSequence;
  });

  return isValid;
};