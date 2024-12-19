import { Dialog, DialogContent } from "./ui/dialog";
import { DoctorProfileHeader } from "./doctor/profile/DoctorProfileHeader";
import { DoctorProfileContent } from "./doctor/profile/DoctorProfileContent";

interface DoctorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for editing doctor profile information
 * Follows ChatGPT styling guidelines with a compact, scrollable layout
 * 
 * @param open - Controls dialog visibility
 * @param onOpenChange - Callback for handling dialog open/close state
 */
export const DoctorProfileDialog = ({ 
  open, 
  onOpenChange 
}: DoctorProfileDialogProps) => {
  console.log('[DoctorProfileDialog] Rendering with:', { open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] max-h-[85vh] p-0 gap-0 bg-chatgpt-main border-chatgpt-border rounded-xl overflow-hidden">
        <DoctorProfileHeader />
        <DoctorProfileContent onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};