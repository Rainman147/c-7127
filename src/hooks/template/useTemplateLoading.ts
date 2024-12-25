import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/components/template/templateTypes';
import { useAvailableTemplates } from './useAvailableTemplates';

export interface UseTemplateLoadingResult {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: Error | null;
  handleError: (error: Error, operation: string) => void;
  availableTemplates: Template[];
}

export const useTemplateLoading = (): UseTemplateLoadingResult => {
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
      errorType: 'data',
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