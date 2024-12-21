import { useEffect } from 'react';
import { CreateTemplateDialog } from './dialogs/CreateTemplateDialog';
import { EditTemplateDialog } from './dialogs/EditTemplateDialog';
import { TemplateList } from './list/TemplateList';
import { TemplateHeaderActions } from './header/TemplateHeaderActions';
import { useTemplateOperations } from './hooks/useTemplateOperations';
import { CreateTemplateForm } from './form/CreateTemplateForm';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export const TemplateManager = () => {
  const {
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
    error
  } = useTemplateOperations();

  const { toast } = useToast();

  useEffect(() => {
    console.log('[TemplateManager] Component mounted with state:', { 
      templatesCount: templates?.length,
      isCreateDialogOpen,
      isEditDialogOpen,
      isLoading,
      hasError: !!error
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load templates. Please try again.",
        variant: "destructive",
      });
    }
  }, [templates, isCreateDialogOpen, isEditDialogOpen, isLoading, error, toast]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32 ml-auto" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load templates. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TemplateHeaderActions onNewTemplate={() => setIsCreateDialogOpen(true)} />
      
      <TemplateList
        templates={templates}
        onEdit={(template) => {
          console.log('[TemplateManager] Editing template:', template);
          setEditingTemplate(template);
          setIsEditDialogOpen(true);
        }}
        onDelete={deleteTemplate}
      />

      <CreateTemplateDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <CreateTemplateForm onSubmit={handleCreateTemplate} />
      </CreateTemplateDialog>

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