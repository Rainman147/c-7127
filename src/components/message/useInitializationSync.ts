import { useState, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';

interface InitializationState {
  containerMounted: boolean;
  subscriptionReady: boolean;
  messagesLoaded: boolean;
}

export const useInitializationSync = () => {
  const [state, setState] = useState<InitializationState>({
    containerMounted: false,
    subscriptionReady: false,
    messagesLoaded: false
  });

  const setContainerMounted = () => {
    logger.debug(LogCategory.STATE, 'InitializationSync', 'Container mounted');
    setState(prev => ({ ...prev, containerMounted: true }));
  };

  const setSubscriptionReady = () => {
    logger.debug(LogCategory.STATE, 'InitializationSync', 'Subscription ready');
    setState(prev => ({ ...prev, subscriptionReady: true }));
  };

  const setMessagesLoaded = () => {
    logger.debug(LogCategory.STATE, 'InitializationSync', 'Messages loaded');
    setState(prev => ({ ...prev, messagesLoaded: true }));
  };

  const isFullyInitialized = state.containerMounted && 
                           state.subscriptionReady && 
                           state.messagesLoaded;

  useEffect(() => {
    if (isFullyInitialized) {
      logger.debug(LogCategory.STATE, 'InitializationSync', 'Fully initialized', state);
    }
  }, [isFullyInitialized, state]);

  return {
    ...state,
    isFullyInitialized,
    setContainerMounted,
    setSubscriptionReady,
    setMessagesLoaded
  };
};