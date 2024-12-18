import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const TemplateManager = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; content: string } | null>(null);

  const handleCreateTemplate = () => {
    if (newTemplateName && newTemplateContent) {
      createTemplate({
        name: newTemplateName,
        content: newTemplateContent,
      });
      setNewTemplateName('');
      setNewTemplateContent('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateTemplate = () => {
    if (editingTemplate) {
      updateTemplate({
        id: editingTemplate.id,
        content: editingTemplate.content,
      });
      setEditingTemplate(null);
      setIsEditDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Templates</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Template Name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Textarea
                placeholder="Template Content"
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                rows={10}
              />
              <Button onClick={handleCreateTemplate}>Create Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-center justify-between p-4 bg-chatgpt-secondary rounded-lg"
          >
            <span className="font-medium">{template.name}</span>
            <div className="flex items-center gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTemplate({
                      id: template.id,
                      content: template.content,
                    })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Template</DialogTitle>
                  </DialogHeader>
                  {editingTemplate && (
                    <div className="space-y-4">
                      <Textarea
                        value={editingTemplate.content}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          content: e.target.value,
                        })}
                        rows={10}
                      />
                      <Button onClick={handleUpdateTemplate}>Save Changes</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this template? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};