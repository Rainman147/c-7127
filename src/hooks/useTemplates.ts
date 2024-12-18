import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface CreateTemplateInput {
  name: string;
  content: string;
}

interface UpdateTemplateInput {
  id: string;
  content: string;
}

export const useTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      console.log('[useTemplates] Fetching templates');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useTemplates] Error fetching templates:', error);
        throw error;
      }

      return data as Template[];
    },
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async ({ name, content }: CreateTemplateInput) => {
      console.log('[useTemplates] Creating template:', { name });
      
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('[useTemplates] Error getting user:', userError);
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('templates')
        .insert([{ 
          name, 
          content,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error('[useTemplates] Error creating template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      console.error('[useTemplates] Create template error:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, content }: UpdateTemplateInput) => {
      console.log('[useTemplates] Updating template:', { id });
      const { data, error } = await supabase
        .from('templates')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useTemplates] Error updating template:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error) => {
      console.error('[useTemplates] Update template error:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      console.log('[useTemplates] Deleting template:', { id });
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useTemplates] Error deleting template:', error);
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
      console.error('[useTemplates] Delete template error:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
  };
};