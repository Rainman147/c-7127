import { CreateTemplateDialog } from './dialogs/CreateTemplateDialog';
import { EditTemplateDialog } from './dialogs/EditTemplateDialog';
import { TemplateList } from './list/TemplateList';
import { TemplateHeaderActions } from './header/TemplateHeaderActions';
import { useTemplateOperations } from './hooks/useTemplateOperations';
import { CreateTemplateForm } from './form/CreateTemplateForm';

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
  } = useTemplateOperations();
  
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