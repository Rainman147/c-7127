import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template, DbTemplate } from "@/types";
import { templates } from "@/components/template/types/defaultTemplates";
import { convertDbTemplate } from "@/types/template";

const getDefaultTemplate = (): Template => templates[0];

const findTemplateById = (templateId: string): Template | undefined => {
  console.log('[useTemplateQueries] Finding template by id:', templateId);
  return templates.find(t => t.id === templateId);
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
      const defaultTemplates = [...templates];
      
      try {
        const { data: customTemplates, error } = await supabase
          .from('templates')
          .select('*');
          
        if (error) {
          console.error('[useTemplatesListQuery] Error fetching custom templates:', error);
          throw error;
        }
        
        const mappedCustomTemplates = customTemplates?.map(template => 
          convertDbTemplate(template as DbTemplate)
        ) || [];
        
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