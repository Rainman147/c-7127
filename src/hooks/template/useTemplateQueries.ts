import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/templateTypes';
import { convertDatabaseTemplate } from '@/utils/template/templateConverter';

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

      return data.map(convertDatabaseTemplate);
    },
  });

  return {
    templates,
    isLoading,
    error
  };
};