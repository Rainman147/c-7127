import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const CreateTemplateDialog = ({
  isOpen,
  onOpenChange,
  children,
}: CreateTemplateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="menu-dialog">
        <DialogHeader className="menu-dialog-header">
          <DialogTitle className="menu-dialog-title">Create New Template</DialogTitle>
        </DialogHeader>
        <div className="menu-dialog-content">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};