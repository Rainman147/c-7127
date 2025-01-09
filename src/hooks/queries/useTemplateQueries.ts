import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template } from "@/components/template/types";
import type { DbTemplate } from "@/components/template/types/Template";
import { templates } from "@/components/template/types/defaultTemplates";
import { isValidTemplate } from "@/components/template/types/guards";
import { convertDbTemplate } from "@/components/template/types/utils";

const getDefaultTemplate = (): Template => {
  console.log('[useTemplateQueries] Using default template');
  const defaultTemplate = templates[0];
  if (!isValidTemplate(defaultTemplate)) {
    throw new Error('Default template is invalid');
  }
  return defaultTemplate;
};

const findTemplateById = (templateId: string): Template | undefined => {
  console.log('[useTemplateQueries] Finding template by id:', templateId);
  const template = templates.find(t => t.id === templateId);
  if (template && !isValidTemplate(template)) {
    console.error('[useTemplateQueries] Found template is invalid:', template);
    return undefined;
  }
  return template;
};

export const useTemplateQuery = (templateId: string | null) => {
  console.log('[useTemplateQuery] Initializing with templateId:', templateId);
  
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) {
        console.log('[useTemplateQuery] No templateId provided, using default template');
        return getDefaultTemplate();
      }
      
      const template = findTemplateById(templateId);
      if (!template) {
        console.warn('[useTemplateQuery] Template not found:', templateId);
        return getDefaultTemplate();
      }
      
      console.log('[useTemplateQuery] Template found:', template.name);
      return template;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTemplatesListQuery = () => {
  console.log('[useTemplatesListQuery] Initializing templates list query');
  
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const defaultTemplates = [...templates].filter(isValidTemplate);
      
      try {
        const { data: customTemplates, error } = await supabase
          .from('templates')
          .select('*');
          
        if (error) {
          console.error('[useTemplatesListQuery] Error fetching custom templates:', error);
          throw error;
        }
        
        const mappedCustomTemplates = customTemplates
          ?.map(template => convertDbTemplate(template as DbTemplate))
          .filter(isValidTemplate) || [];
        
        const allTemplates = [...defaultTemplates, ...mappedCustomTemplates];
        console.log('[useTemplatesListQuery] Fetched templates:', allTemplates.length);
        return allTemplates;
      } catch (error) {
        console.error('[useTemplatesListQuery] Failed to fetch templates:', error);
        return defaultTemplates;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};