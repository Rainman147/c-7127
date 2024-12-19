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
      <DialogContent className="max-w-[380px] max-h-[85vh] p-0 gap-0 bg-chatgpt-main border-chatgpt-border">
        <DialogHeader className="px-4 py-3 border-b border-chatgpt-border">
          <DialogTitle className="text-base">My Profile</DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-4 py-4 max-h-[calc(85vh-120px)] chat-scrollbar">
          <DoctorProfileForm onSuccess={() => onOpenChange(false)} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};