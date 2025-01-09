import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template, DbTemplate } from "@/types/template";
import { isValidTemplate } from "@/types/template/guards";
import { convertDbTemplate } from "@/types/template/utils";
import { templates } from "@/types/template/templates";
import { useToast } from "@/hooks/use-toast";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000; // 1 second

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
  const { toast } = useToast();
  
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
        toast({
          title: "Template Not Found",
          description: "Using default template instead.",
          variant: "default",
        });
        return getDefaultTemplate();
      }
      
      console.log('[useTemplateQuery] Template found:', template.name);
      return template;
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), RETRY_DELAY),
    onError: (error) => {
      console.error('[useTemplateQuery] Error fetching template:', error);
      toast({
        title: "Error Loading Template",
        description: "There was an error loading the template. Using default template instead.",
        variant: "destructive",
      });
    },
  });
};

export const useTemplatesListQuery = () => {
  console.log('[useTemplatesListQuery] Initializing templates list query');
  const { toast } = useToast();
  
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
        toast({
          title: "Error Loading Templates",
          description: "Only default templates are available. Please try again later.",
          variant: "destructive",
        });
        return defaultTemplates;
      }
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), RETRY_DELAY),
    onError: (error) => {
      console.error('[useTemplatesListQuery] Error in templates list query:', error);
    },
  });
};