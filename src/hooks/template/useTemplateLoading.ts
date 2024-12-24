import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import { useAvailableTemplates } from './useAvailableTemplates';
import type { Template } from '@/components/template/templateTypes';

export const useTemplateLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const availableTemplates = useAvailableTemplates();

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.STATE, 'useTemplateLoading', 'Template loading error:', {
      error,
      operation,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'useTemplateLoading',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      operation,
      additionalInfo: {
        isLoading,
        hasError: !!error
      }
    });

    setError(error);
    toast({
      title: "Error Loading Template",
      description: error.message,
      variant: "destructive",
    });
  }, [isLoading, error, toast]);

  return {
    isLoading,
    setIsLoading,
    error,
    handleError,
    availableTemplates
  };
};