import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PatientFormFields } from "./PatientFormFields";
import { usePatientForm } from "./usePatientForm";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewPatientModal = ({ isOpen, onClose, onSuccess }: NewPatientModalProps) => {
  const {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = usePatientForm(onSuccess, onClose);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl bg-chatgpt-main text-gray-100">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
          </DialogHeader>

          <PatientFormFields
            formData={formData}
            handleInputChange={handleInputChange}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-sm text-white/70 border-chatgpt-border/20 hover:bg-chatgpt-hover/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="text-sm text-chatgpt-main bg-white hover:bg-gray-100"
            >
              {isLoading ? "Creating..." : "Create Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};