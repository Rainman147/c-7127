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
import { Patient } from "@/types";

interface NewPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPatient?: Patient | null;
  onSuccess?: () => void;
}

export const NewPatientModal = ({ 
  open, 
  onOpenChange, 
  existingPatient, 
  onSuccess 
}: NewPatientModalProps) => {
  const {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
  } = usePatientForm(onSuccess, () => onOpenChange(false), existingPatient);

  return (
    <StyledDialog open={open} onOpenChange={onOpenChange}>
      <StyledDialogContent className="w-full max-w-2xl">
        <StyledDialogHeader>
          <StyledDialogTitle>
            {existingPatient ? 'Edit Patient' : 'New Patient'}
          </StyledDialogTitle>
        </StyledDialogHeader>

        <PatientForm
          formData={formData}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          handleInputChange={handleInputChange}
        />
        
        <StyledDialogFooter>
          <FormActions
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        </StyledDialogFooter>
      </StyledDialogContent>
    </StyledDialog>
  );
};