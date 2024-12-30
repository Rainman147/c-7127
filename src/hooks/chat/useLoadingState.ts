import { useCallback } from 'react';
import { useMessages } from '@/contexts/MessageContext';
import { logger, LogCategory } from '@/utils/logging';

export const useLoadingState = () => {
  const { loadingStates, setLoadingState } = useMessages();

  const startLoading = useCallback((key: keyof typeof loadingStates) => {
    logger.debug(LogCategory.STATE, 'LoadingState', `Starting ${key}`, {
      previousState: loadingStates[key],
      timestamp: new Date().toISOString()
    });
    setLoadingState(key, true);
  }, [loadingStates, setLoadingState]);

  const stopLoading = useCallback((key: keyof typeof loadingStates) => {
    logger.debug(LogCategory.STATE, 'LoadingState', `Stopping ${key}`, {
      previousState: loadingStates[key],
      timestamp: new Date().toISOString()
    });
    setLoadingState(key, false);
  }, [loadingStates, setLoadingState]);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    isAnyLoading: Object.values(loadingStates).some(Boolean)
  };
};

export default useLoadingState;