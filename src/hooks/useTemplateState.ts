import { useState } from 'react';
import type { Template } from '@/components/template/types';

export const useTemplateState = () => {
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  const handleTemplateChange = (template: Template) => {
    console.log('[useTemplateState] Template changed to:', template.name);
    setCurrentTemplate(template);
  };

  return {
    currentTemplate,
    handleTemplateChange,
  };
};