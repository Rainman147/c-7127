import { useState } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TemplateFormData {
  name: string;
  content: string;
  instructions: {
    dataFormatting: string;
    priorityRules: string;
    specialConditions: string;
  };
  schema: {
    sections: string[];
    requiredFields: string[];
  };
}

export const TemplateManager = () => {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="menu-dialog">
            <DialogHeader className="menu-dialog-header">
              <DialogTitle className="menu-dialog-title">Create New Template</DialogTitle>
            </DialogHeader>
            <div className="menu-dialog-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name</label>
                  <Input
                    placeholder="Template Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Template Content</label>
                  <Textarea
                    placeholder="Template Content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Instructions</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Data Formatting</label>
                    <Textarea
                      placeholder="Specify data formatting requirements..."
                      value={formData.instructions.dataFormatting}
                      onChange={(e) => handleInstructionChange('dataFormatting', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority Rules</label>
                    <Textarea
                      placeholder="Define priority rules..."
                      value={formData.instructions.priorityRules}
                      onChange={(e) => handleInstructionChange('priorityRules', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Special Conditions</label>
                    <Textarea
                      placeholder="Specify any special conditions..."
                      value={formData.instructions.specialConditions}
                      onChange={(e) => handleInstructionChange('specialConditions', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreateTemplate}
                  className="w-full"
                >
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="menu-box p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{template.name}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="menu-box p-3 max-w-xs">
                    <div className="space-y-2">
                      <p className="font-medium">Instructions:</p>
                      {template.instructions && (
                        <div className="text-sm">
                          <p>Formatting: {template.instructions.dataFormatting}</p>
                          <p>Priority Rules: {template.instructions.priorityRules}</p>
                          <p>Special Conditions: {template.instructions.specialConditions}</p>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
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
                <DialogContent className="menu-dialog">
                  <DialogHeader className="menu-dialog-header">
                    <DialogTitle className="menu-dialog-title">Edit Template</DialogTitle>
                  </DialogHeader>
                  {editingTemplate && (
                    <div className="menu-dialog-content">
                      <Textarea
                        value={editingTemplate.content}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          content: e.target.value,
                        })}
                        rows={10}
                      />
                      <Button onClick={handleUpdateTemplate} className="mt-4">Save Changes</Button>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};