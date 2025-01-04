import {
  StyledDialog,
  StyledDialogContent,
  StyledDialogHeader,
  StyledDialogTitle,
  StyledDialogFooter,
} from "@/components/ui/styled-dialog";
import { PatientForm } from "../Forms/PatientForm";
import { FormActions } from "../Forms/components/FormActions";
import { usePatientForm } from "./usePatientForm";

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
        />
        
        <StyledDialogFooter>
          <FormActions
            onCancel={onClose}
            isLoading={isLoading}
          />
        </StyledDialogFooter>
      </StyledDialogContent>
    </StyledDialog>
  );
};