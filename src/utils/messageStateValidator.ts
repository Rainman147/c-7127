import { Message, MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

type StateTransition = {
  from: MessageStatus;
  to: MessageStatus;
};

const validTransitions: StateTransition[] = [
  { from: 'queued', to: 'sending' },
  { from: 'sending', to: 'delivered' },
  { from: 'sending', to: 'failed' },
  { from: 'failed', to: 'sending' },
];

export const validateStateTransition = (
  message: Message,
  newStatus: MessageStatus
): boolean => {
  const currentStatus = message.status || 'queued';
  const isValid = validTransitions.some(
    transition => 
      transition.from === currentStatus && 
      transition.to === newStatus
  );

  if (!isValid) {
    logger.warn(LogCategory.STATE, 'MessageStateValidator', 'Invalid state transition:', {
      messageId: message.id,
      from: currentStatus,
      to: newStatus,
      timestamp: new Date().toISOString()
    });
  }

  return isValid;
};