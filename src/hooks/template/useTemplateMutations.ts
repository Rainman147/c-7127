import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CreateTemplateInput } from '@/types/templates/base';
import { convertDatabaseTemplate } from '@/utils/template/templateConverter';

export const useTemplateMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTemplate = useMutation({
    mutationFn: async ({ name, content, instructions, schema }: CreateTemplateInput) => {
      console.log('[useTemplateMutations] Creating template:', { name });
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('[useTemplateMutations] Error getting user:', userError);
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('templates')
        .insert([{ 
          name, 
          content,
          instructions,
          schema,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error('[useTemplateMutations] Error creating template:', error);
        throw error;
      }

      return convertDatabaseTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      console.error('[useTemplateMutations] Create template error:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      console.log('[useTemplateMutations] Updating template:', { id });
      const { data, error } = await supabase
        .from('templates')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useTemplateMutations] Error updating template:', error);
        throw error;
      }

      return convertDatabaseTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error) => {
      console.error('[useTemplateMutations] Update template error:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      console.log('[useTemplateMutations] Deleting template:', { id });
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useTemplateMutations] Error deleting template:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error) => {
      console.error('[useTemplateMutations] Delete template error:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  return {
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
  };
};