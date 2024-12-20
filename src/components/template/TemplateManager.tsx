import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateTemplateDialog } from './dialogs/CreateTemplateDialog';
import { EditTemplateDialog } from './dialogs/EditTemplateDialog';
import { TemplateListItem } from './list/TemplateListItem';

export const TemplateManager = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Templates</h2>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <AlertDialog key={template.id}>
            <TemplateListItem
              template={template}
              onEdit={(id) => {
                setEditingTemplate({
                  id,
                  content: template.content,
                });
                setIsEditDialogOpen(true);
              }}
              onDelete={() => {}}
            />
            <AlertDialogContent className="menu-dialog">
              <AlertDialogHeader className="menu-dialog-header">
                <AlertDialogTitle className="menu-dialog-title">Delete Template</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70">
                  Are you sure you want to delete this template? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="menu-dialog-content">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>

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
