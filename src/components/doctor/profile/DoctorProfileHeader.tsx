import { DialogHeader, DialogTitle } from "../../ui/dialog";

/**
 * Header component for the doctor profile dialog
 * Displays the title with consistent ChatGPT-style formatting
 */
export const DoctorProfileHeader = () => {
  console.log('[DoctorProfileHeader] Rendering header');
  
  return (
    <DialogHeader className="px-4 py-3 border-b border-chatgpt-border bg-chatgpt-secondary/10">
      <DialogTitle className="text-sm font-medium text-white/90">My Profile</DialogTitle>
    </DialogHeader>
  );
};