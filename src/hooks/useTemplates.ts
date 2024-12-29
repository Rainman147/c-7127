import { useTemplateQueries } from './template/useTemplateQueries';
import { useTemplateMutations } from './template/useTemplateMutations';

export const useTemplates = () => {
  const { templates, isLoading, error } = useTemplateQueries();
  const { createTemplate, updateTemplate, deleteTemplate } = useTemplateMutations();

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};