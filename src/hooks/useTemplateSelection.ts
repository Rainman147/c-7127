import { useCallback } from 'react';
import { useTemplateQuery } from './queries/useTemplateQueries';
import { useSearchParams } from 'react-router-dom';
import type { Template } from '@/components/template/types';

export const useTemplateSelection = (
  currentChatId: string | null,
  onTemplateChange?: (template: Template) => void
) => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');

  console.log('[useTemplateSelection] Initializing with:', { 
    currentChatId, 
    templateId,
    hasChangeHandler: !!onTemplateChange 
  });

  const { 
    data: selectedTemplate,
    isLoading,
    error
  } = useTemplateQuery(templateId);

  const handleTemplateChange = useCallback((template: Template) => {
    console.log('[useTemplateSelection] Template change triggered:', template.name);
    onTemplateChange?.(template);
  }, [onTemplateChange]);

  return {
    selectedTemplate,
    isLoading,
    error,
    handleTemplateChange
  };
};