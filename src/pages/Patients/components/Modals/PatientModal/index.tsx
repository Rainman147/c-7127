import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "../../Forms/PatientForm";
import { usePatientForm } from "../../NewPatient/usePatientForm";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PatientModal = ({ isOpen, onClose, onSuccess }: PatientModalProps) => {
  const {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = usePatientForm(onSuccess, onClose);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl bg-chatgpt-main text-gray-100">
        <DialogHeader>
          <DialogTitle>New Patient</DialogTitle>
        </DialogHeader>

        <PatientForm
          formData={formData}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};