import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Template, DbTemplate } from "@/components/template/types/Template";
import { templates } from "@/components/template/types/defaultTemplates";
import { parseJsonField } from "@/components/template/types/utils";

// Helper functions
const getDefaultTemplate = (): Template => templates[0];

const findTemplateById = (templateId: string): Template | undefined => {
  console.log('[useTemplateQueries] Finding template by id:', templateId);
  return templates.find(t => t.id === templateId);
};

// Convert DB template to frontend template
const convertDbTemplate = (dbTemplate: DbTemplate): Template => ({
  ...dbTemplate,
  systemInstructions: dbTemplate.system_instructions,
  instructions: parseJsonField(dbTemplate.instructions),
  schema: parseJsonField(dbTemplate.schema),
  priority_rules: parseJsonField(dbTemplate.priority_rules),
});

// Fetch a single template
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
      const defaultTemplates = [...templates];
      
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
        const mappedCustomTemplates = customTemplates?.map(convertDbTemplate) || [];
        
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