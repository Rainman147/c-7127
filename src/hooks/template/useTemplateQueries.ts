import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/templateTypes';
import { convertDatabaseTemplate, type DatabaseTemplate } from '@/types/templates/database';

export const useTemplateQueries = (templateId?: string) => {
  console.log('[useTemplateQueries] Initializing template queries with ID:', templateId);
  
  const { 
    data: templates = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['templates', templateId],
    queryFn: async () => {
      console.log('[useTemplateQueries] Fetching templates');
      const query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templateId) {
        query.eq('id', templateId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useTemplateQueries] Error fetching templates:', error);
        throw error;
      }

      return data.map((template: DatabaseTemplate) => convertDatabaseTemplate(template));
    },
  });

  return {
    templates,
    isLoading,
    error
  };
};