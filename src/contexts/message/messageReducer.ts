import { MessageState, MessageAction } from '@/types/messageContext';
import { baseReducer, initialState } from './messageReducer/baseReducer';
import { messageOperationsReducer } from './messageReducer/messageOperationsReducer';
import { editingReducer } from './messageReducer/editingReducer';
import { confirmationReducer } from './messageReducer/confirmationReducer';
import { logger, LogCategory } from '@/utils/logging';

export { initialState };

export const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  const startTime = performance.now();
  
  logger.debug(LogCategory.STATE, 'messageReducer', 'Processing action:', {
    type: action.type,
    currentMessageCount: state.messages.length,
    timestamp: new Date().toISOString()
  });

  // Apply reducers in sequence
  let nextState = state;
  nextState = baseReducer(nextState, action);
  nextState = messageOperationsReducer(nextState, action);
  nextState = editingReducer(nextState, action);
  nextState = confirmationReducer(nextState, action);

  const duration = performance.now() - startTime;
  
  if (nextState !== state) {
    logger.debug(LogCategory.PERFORMANCE, 'messageReducer', 'State update complete:', {
      actionType: action.type,
      duration: `${duration.toFixed(2)}ms`,
      messageCount: nextState.messages.length,
      pendingCount: nextState.pendingMessages.length,
      timestamp: new Date().toISOString()
    });
  }

  return nextState;
};