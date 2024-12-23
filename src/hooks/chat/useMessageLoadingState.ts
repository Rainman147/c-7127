import { useState } from 'react';

export const useMessageLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('[useMessageLoadingState] Loading state:', { isLoading });
  
  return {
    isLoading,
    setIsLoading
  };
};