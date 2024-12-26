import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/templateTypes';
import { convertDatabaseTemplate } from '@/types/templates/database';
import { logger, LogCategory } from '@/utils/logging';

export const useTemplateQueries = () => {
  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      logger.debug(LogCategory.DATABASE, 'useTemplateQueries', 'Fetching templates');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error(LogCategory.DATABASE, 'useTemplateQueries', 'Error fetching templates', { error });
        throw error;
      }

      return data.map(convertDatabaseTemplate);
    },
  });

  return {
    templates,
    isLoading,
    error,
    refetch
  };
};