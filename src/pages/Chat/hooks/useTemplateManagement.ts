import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTemplateQuery } from '@/hooks/queries/useTemplateQueries';
import type { Template } from '@/types';

export const useTemplateManagement = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const templateId = params.get('templateId');

  const { 
    data: selectedTemplate, 
    isLoading: isTemplateLoading,
    error: templateError 
  } = useTemplateQuery(templateId);

  const handleTemplateChange = (template: Template) => {
    console.log('[useTemplateManagement] Template changed:', template.name);
    const params = new URLSearchParams(location.search);
    if (template.id === 'live-session') {
      params.delete('templateId');
    } else {
      params.set('templateId', template.id);
    }
    return params.toString();
  };

  return {
    selectedTemplate,
    handleTemplateChange,
    isTemplateLoading,
    templateError
  };
};