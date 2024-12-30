import { MessageStatus } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

type StateTransition = {
  from: MessageStatus;
  to: MessageStatus;
};

const validTransitions = new Map<MessageStatus, MessageStatus[]>([
  ['queued', ['sending', 'failed']],
  ['sending', ['delivered', 'failed']],
  ['delivered', ['seen', 'failed']],
  ['failed', ['sending']],
  ['seen', []],
]);

export const validateStateTransition = (
  currentState: MessageStatus,
  nextState: MessageStatus,
  messageId: string
): boolean => {
  const validNextStates = validTransitions.get(currentState) || [];
  const isValid = validNextStates.includes(nextState);

  logger.debug(LogCategory.STATE, 'MessageStateValidator', 'Validating state transition:', {
    messageId,
    currentState,
    nextState,
    isValid,
    validTransitions: validNextStates,
    timestamp: new Date().toISOString()
  });

  if (!isValid) {
    logger.error(LogCategory.STATE, 'MessageStateValidator', 'Invalid state transition:', {
      messageId,
      currentState,
      nextState,
      allowedTransitions: validNextStates,
      timestamp: new Date().toISOString()
    });
  }

  return isValid;
};

export const getValidNextStates = (currentState: MessageStatus): MessageStatus[] => {
  return validTransitions.get(currentState) || [];
};