import {
  StyledDialog,
  StyledDialogContent,
  StyledDialogHeader,
  StyledDialogTitle,
} from "@/components/ui/styled-dialog";
import { PatientForm } from "../Forms/PatientForm";
import { usePatientForm } from "../../NewPatient/usePatientForm";

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewPatientModal = ({ isOpen, onClose, onSuccess }: PatientModalProps) => {
  const {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = usePatientForm(onSuccess, onClose);

  return (
    <StyledDialog open={isOpen} onOpenChange={onClose}>
      <StyledDialogContent className="w-full max-w-2xl">
        <StyledDialogHeader>
          <StyledDialogTitle>New Patient</StyledDialogTitle>
        </StyledDialogHeader>

        <PatientForm
          formData={formData}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          onCancel={onClose}
        />
      </StyledDialogContent>
    </StyledDialog>
  );
};
