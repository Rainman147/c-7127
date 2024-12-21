import { useSearchParams } from 'react-router-dom';

export const useTemplateParams = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const isValidTemplateId = templateId && /^[0-9a-fA-F-]+$/.test(templateId);

  console.log('[useTemplateParams] Current template params:', {
    templateId,
    isValidTemplateId
  });

  return {
    templateId: isValidTemplateId ? templateId : null,
    isValidTemplateId
  };
};