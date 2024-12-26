import { useTemplateQueries } from './template/useTemplateQueries';
import { useTemplateMutations } from './template/useTemplateMutations';

export const useTemplates = () => {
  const { templates, isLoading, error, refetch } = useTemplateQueries();
  const { createTemplate, updateTemplate, deleteTemplate } = useTemplateMutations();

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};