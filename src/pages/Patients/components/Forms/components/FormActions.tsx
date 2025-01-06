import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  isLoading?: boolean;
}

export const FormActions = ({ onCancel, isLoading }: FormActionsProps) => {
  return (
    <>
      <Button
        type="button"
        variant="modalCancel"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        form="new-patient-form"
        variant="modalConfirm"
        disabled={isLoading}
      >
        {isLoading ? "Creating..." : "Create Patient"}
      </Button>
    </>
  );
};