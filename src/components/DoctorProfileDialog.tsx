import { Dialog, DialogContent } from "./ui/dialog";
import { DoctorProfileHeader } from "./doctor/profile/DoctorProfileHeader";
import { DoctorProfileContent } from "./doctor/profile/DoctorProfileContent";

interface DoctorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for editing doctor profile information
 * Uses consistent menu styling from our global CSS classes
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
      <DialogContent className="menu-dialog">
        <DoctorProfileHeader />
        <DoctorProfileContent onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};