import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/templateTypes';
import { convertDatabaseTemplate, type DatabaseTemplate } from '@/types/templates/database';

export const useTemplateQueries = () => {
  console.log('[useTemplateQueries] Initializing template queries');
  
  const { 
    data: templates = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      console.log('[useTemplateQueries] Fetching templates');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

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