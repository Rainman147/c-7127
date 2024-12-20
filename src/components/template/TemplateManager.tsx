import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { CreateTemplateDialog } from './dialogs/CreateTemplateDialog';
import { EditTemplateDialog } from './dialogs/EditTemplateDialog';
import { TemplateList } from './list/TemplateList';
import { TemplateHeaderActions } from './header/TemplateHeaderActions';

/**
 * TemplateManager Component
 * 
 * Manages the creation, editing, and deletion of templates.
 * Provides a UI for users to:
 * - View all templates
 * - Create new templates
 * - Edit existing templates
 * - Delete templates
 */
export const TemplateManager = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { toast } = useToast();
  
  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    instructions: {
      dataFormatting: '',
      priorityRules: '',
      specialConditions: '',
    },
    schema: {
      sections: [],
      requiredFields: [],
    },
  });
  
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; content: string } | null>(null);

  // Form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInstructionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: {
        ...prev.instructions,
        [field]: value,
      },
    }));
  };

  // Template operations
  const handleCreateTemplate = async () => {
    console.log('[TemplateManager] Creating template with data:', formData);
    if (formData.name && formData.content) {
      try {
        await createTemplate({
          name: formData.name,
          content: formData.content,
          instructions: formData.instructions,
          schema: formData.schema,
        });
        
        toast({
          title: "Success",
          description: "Template created successfully",
        });
        
        // Reset form
        setFormData({
          name: '',
          content: '',
          instructions: {
            dataFormatting: '',
            priorityRules: '',
            specialConditions: '',
          },
          schema: {
            sections: [],
            requiredFields: [],
          },
        });
        setIsCreateDialogOpen(false);
      } catch (error) {
        console.error('[TemplateManager] Error creating template:', error);
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateTemplate = async () => {
    console.log('[TemplateManager] Updating template:', editingTemplate);
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
      } catch (error) {
        console.error('[TemplateManager] Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <TemplateHeaderActions onNewTemplate={() => setIsCreateDialogOpen(true)} />
      
      <TemplateList
        templates={templates}
        onEdit={(template) => {
          setEditingTemplate(template);
          setIsEditDialogOpen(true);
        }}
        onDelete={deleteTemplate}
      />

      <CreateTemplateDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onInputChange={handleInputChange}
        onInstructionChange={handleInstructionChange}
        onSubmit={handleCreateTemplate}
      />

      <EditTemplateDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingTemplate={editingTemplate}
        onContentChange={(content) => 
          setEditingTemplate(prev => prev ? { ...prev, content } : null)
        }
        onSave={handleUpdateTemplate}
      />
    </div>
  );
};