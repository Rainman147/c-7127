import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { templateSchema } from "@/schemas/templateSchemas";

interface EditTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: { id: string; content: string } | null;
  onContentChange: (content: string) => void;
  onSave: () => void;
}

export const EditTemplateDialog = ({
  isOpen,
  onOpenChange,
  editingTemplate,
  onContentChange,
  onSave,
}: EditTemplateDialogProps) => {
  const { toast } = useToast();

  if (!editingTemplate) return null;

  const handleSave = () => {
    try {
      // Validate the content
      templateSchema.shape.content.parse(editingTemplate.content);
      onSave();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Validation Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="menu-dialog">
        <DialogHeader className="menu-dialog-header">
          <DialogTitle className="menu-dialog-title">Edit Template</DialogTitle>
        </DialogHeader>
        <div className="menu-dialog-content">
          <Textarea
            value={editingTemplate.content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={10}
          />
          <Button onClick={handleSave} className="mt-4">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};