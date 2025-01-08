import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { validateTemplateId } from '@/utils/template/urlParamValidation';

export const useUrlStateManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateTemplateId = useCallback((templateId: string | null) => {
    console.log('[useUrlStateManager] Updating template ID:', templateId);
    
    const params = new URLSearchParams(searchParams);
    if (!templateId || !validateTemplateId(templateId)) {
      params.delete('templateId');
    } else {
      params.set('templateId', templateId);
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    updateTemplateId
  };
};