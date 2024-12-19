import { ScrollArea } from "../../ui/scroll-area";
import { DoctorProfileForm } from "../DoctorProfileForm";

interface DoctorProfileContentProps {
  onSuccess: () => void;
}

/**
 * Content component for the doctor profile dialog
 * Wraps the form in a scrollable area with consistent styling
 */
export const DoctorProfileContent = ({ onSuccess }: DoctorProfileContentProps) => {
  console.log('[DoctorProfileContent] Rendering content area');

  return (
    <ScrollArea className="px-4 py-4 max-h-[calc(85vh-120px)] chat-scrollbar">
      <DoctorProfileForm onSuccess={onSuccess} />
    </ScrollArea>
  );
};