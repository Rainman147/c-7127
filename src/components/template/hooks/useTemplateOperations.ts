import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/components/template/templateTypes';
import type { CreateTemplateInput } from '@/types/templates/base';

export const useTemplateOperations = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate, isLoading, error } = useTemplates();
  const { toast } = useToast();
  
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; content: string } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreateTemplate = async (formData: CreateTemplateInput) => {
    console.log('[useTemplateOperations] Creating template with data:', formData);
    if (formData.name && formData.content) {
      try {
        await createTemplate(formData);
        toast({
          title: "Success",
          description: "Template created successfully",
        });
        setIsCreateDialogOpen(false);
        return true;
      } catch (error) {
        console.error('[useTemplateOperations] Error creating template:', error);
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive",
        });
        return false;
      }
    }
    return false;
  };

  const handleUpdateTemplate = async () => {
    console.log('[useTemplateOperations] Updating template:', editingTemplate);
    if (editingTemplate) {
      try {
        await updateTemplate({
          id: editingTemplate.id,
          content: editingTemplate.content,
        });
        
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
        
        setEditingTemplate(null);
        setIsEditDialogOpen(false);
        return true;
      } catch (error) {
        console.error('[useTemplateOperations] Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive",
        });
        return false;
      }
    }
    return false;
  };

  return {
    templates,
    editingTemplate,
    setEditingTemplate,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    handleCreateTemplate,
    handleUpdateTemplate,
    deleteTemplate,
    isLoading,
    error,
  };
};