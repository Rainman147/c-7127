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
      <DialogContent className="w-full max-w-2xl bg-gray-900 text-gray-100">
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};