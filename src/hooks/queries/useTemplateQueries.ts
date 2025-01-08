import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { findTemplateById } from "@/utils/template/templateStateManager";
import type { Template } from "@/components/template/types";
import { templates } from "@/components/template/types";

// Fetch a single template
export const useTemplateQuery = (templateId: string | null) => {
  console.log('[useTemplateQuery] Initializing with templateId:', templateId);
  
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) {
        console.log('[useTemplateQuery] No templateId provided, using default template');
        return findTemplateById('live-session') as Template;
      }
      
      const template = findTemplateById(templateId);
      if (!template) {
        console.warn('[useTemplateQuery] Template not found:', templateId);
        return findTemplateById('live-session') as Template;
      }
      
      console.log('[useTemplateQuery] Template found:', template.name);
      return template;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// Fetch all available templates
export const useTemplatesListQuery = () => {
  console.log('[useTemplatesListQuery] Initializing templates list query');
  
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      // First get hardcoded templates
      const defaultTemplates = await Promise.resolve([...templates]);
      
      try {
        // Then fetch user's custom templates from Supabase
        const { data: customTemplates, error } = await supabase
          .from('templates')
          .select('*');
          
        if (error) {
          console.error('[useTemplatesListQuery] Error fetching custom templates:', error);
          throw error;
        }
        
        // Map custom templates to match Template type
        const mappedCustomTemplates = customTemplates?.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          systemInstructions: template.system_instructions,
          content: template.content,
          instructions: template.instructions,
          schema: template.schema,
          priority_rules: template.priority_rules,
          created_at: template.created_at,
          updated_at: template.updated_at,
          user_id: template.user_id
        })) || [];
        
        // Combine and return all templates
        const allTemplates = [...defaultTemplates, ...mappedCustomTemplates];
        console.log('[useTemplatesListQuery] Fetched templates:', allTemplates.length);
        return allTemplates;
      } catch (error) {
        console.error('[useTemplatesListQuery] Failed to fetch templates:', error);
        return defaultTemplates;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};