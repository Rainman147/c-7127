import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DoctorProfileForm } from "./doctor/DoctorProfileForm";
import { ScrollArea } from "./ui/scroll-area";

interface DoctorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DoctorProfileDialog = ({ 
  open, 
  onOpenChange 
}: DoctorProfileDialogProps) => {
  console.log('[DoctorProfileDialog] Rendering with:', { open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-6 pb-6 max-h-[calc(80vh-120px)] chat-scrollbar">
          <DoctorProfileForm onSuccess={() => onOpenChange(false)} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};