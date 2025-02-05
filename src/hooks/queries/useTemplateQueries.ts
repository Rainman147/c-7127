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

const findTemplateInDb = async (templateId: string): Promise<Template | undefined> => {
  console.log('[useTemplateQueries] Finding template in database:', templateId);
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

  if (error) {
    console.error('[useTemplateQueries] Error finding template:', error);
    return undefined;
  }

  if (!data) {
    console.log('[useTemplateQueries] Template not found in database');
    return undefined;
  }

  const template = convertDbTemplate(data as DbTemplate);
  if (!isValidTemplate(template)) {
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
      
      const template = await findTemplateInDb(templateId);
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
    meta: {
      errorHandler: (error: Error) => {
        console.error('[useTemplateQuery] Error fetching template:', error);
        toast({
          title: "Error Loading Template",
          description: "There was an error loading the template. Using default template instead.",
          variant: "destructive",
        });
      }
    }
  });
};

export const useTemplatesListQuery = () => {
  console.log('[useTemplatesListQuery] Initializing templates list query');
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const { data: templates, error } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('[useTemplatesListQuery] Error fetching templates:', error);
          throw error;
        }
        
        const validTemplates = templates
          ?.map(template => convertDbTemplate(template as DbTemplate))
          .filter(isValidTemplate) || [];
        
        console.log('[useTemplatesListQuery] Fetched templates:', validTemplates.length);
        return validTemplates;
      } catch (error) {
        console.error('[useTemplatesListQuery] Failed to fetch templates:', error);
        toast({
          title: "Error Loading Templates",
          description: "Failed to load templates. Please try again later.",
          variant: "destructive",
        });
        return [];
      }
    },
    staleTime: STALE_TIME,
    retry: RETRY_COUNT,
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), RETRY_DELAY),
    meta: {
      errorHandler: (error: Error) => {
        console.error('[useTemplatesListQuery] Error in templates list query:', error);
      }
    }
  });
};