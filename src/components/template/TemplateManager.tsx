import { useEffect } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { logger, LogCategory } from '@/utils/logging';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateList } from './list/TemplateList';
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