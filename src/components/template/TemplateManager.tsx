import { useEffect } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateList } from './list/TemplateList';
import { TemplateHeader } from './TemplateHeader';
import { useTemplateOperations } from './hooks/useTemplateOperations';
import { useTemplateContext } from '@/contexts/TemplateContext';
import type { Template } from './templateTypes';

export const TemplateManager = () => {
  const { subscribe, cleanup } = useRealTime();
  const { templates, isLoading, error } = useTemplates();
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

  useEffect(() => {
    logger.debug(LogCategory.WEBSOCKET, 'TemplateManager', 'Setting up template subscriptions');
    
    const channel = subscribe({
      schema: 'public',
      table: 'templates',
      event: '*',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'TemplateManager', 'Received template update:', payload);
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'TemplateManager', 'Subscription error:', error);
      }
    });

    return () => {
      cleanup();
    };
  }, [subscribe, cleanup]);

  const handleTemplateSelect = (template: Template) => {
    setGlobalTemplate(template);
  };

  const handleEditClick = (template: Template) => {
    setEditingTemplate({
      id: template.id,
      content: template.content || template.systemInstructions,
    });
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        Error loading templates: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TemplateHeader
        onCreateClick={() => setIsCreateDialogOpen(true)}
        isCreateDialogOpen={isCreateDialogOpen}
        onCreateDialogClose={() => setIsCreateDialogOpen(false)}
        onTemplateCreate={handleCreateTemplate}
      />

      <TemplateList
        templates={templates}
        isLoading={isLoading}
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