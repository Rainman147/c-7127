import { DialogHeader, DialogTitle } from "../../ui/dialog";

/**
 * Header component for the doctor profile dialog
 * Uses consistent menu styling from our global CSS classes
 */
export const DoctorProfileHeader = () => {
  console.log('[DoctorProfileHeader] Rendering header');
  
  return (
    <DialogHeader className="menu-dialog-header">
      <DialogTitle className="menu-dialog-title">My Profile</DialogTitle>
    </DialogHeader>
  );
};