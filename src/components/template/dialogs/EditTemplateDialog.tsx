import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  if (!editingTemplate) return null;

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
          <Button onClick={onSave} className="mt-4">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};