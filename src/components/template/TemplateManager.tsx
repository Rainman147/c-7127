import { useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateList } from './list/TemplateList';
import { useTemplateOperations } from './hooks/useTemplateOperations';
import { useTemplateContext } from '@/contexts/TemplateContext';
import { useTemplateRealtime } from '@/hooks/template/useTemplateRealtime';
import type { Template } from './templateTypes';

export const TemplateManager = () => {
  const { templates, isLoading, error, refetch } = useTemplates();
  const { setGlobalTemplate } = useTemplateContext();
  const {
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

  // Set up real-time updates
  useTemplateRealtime((template) => {
    logger.debug(LogCategory.WEBSOCKET, 'TemplateManager', 'Refreshing templates after real-time update');
    refetch();
  });

  useEffect(() => {
    logger.debug(LogCategory.COMPONENT, 'TemplateManager', 'Component mounted', {
      templatesCount: templates?.length,
      isLoading,
      hasError: !!error
    });
    
    return () => {
      logger.debug(LogCategory.COMPONENT, 'TemplateManager', 'Component unmounting');
    };
  }, [templates?.length, isLoading, error]);

  const handleTemplateSelect = (template: Template) => {
    logger.debug(LogCategory.USER_ACTION, 'TemplateManager', 'Template selected', {
      templateId: template.id,
      templateName: template.name
    });
    setGlobalTemplate(template);
  };

  const handleEditClick = (template: Template) => {
    logger.debug(LogCategory.USER_ACTION, 'TemplateManager', 'Edit template clicked', {
      templateId: template.id,
      templateName: template.name
    });
    setEditingTemplate({
      id: template.id,
      content: template.content || '',
    });
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <div className="text-center text-white/70 mt-8">
        Error loading templates: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Templates</h2>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="btn-primary"
        >
          Create Template
        </button>
      </div>

      <TemplateList
        templates={templates || []}
        onEdit={handleEditClick}
        onDelete={deleteTemplate}
        onSelect={handleTemplateSelect}
        editingTemplate={editingTemplate}
        isEditDialogOpen={isEditDialogOpen}
        onEditDialogClose={() => setIsEditDialogOpen(false)}
        onTemplateUpdate={handleUpdateTemplate}
      />
    </div>
  );
};