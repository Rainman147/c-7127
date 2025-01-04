import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  isLoading?: boolean;
}

export const FormActions = ({ onCancel, isLoading }: FormActionsProps) => {
  return (
    <div className="flex justify-end gap-3">
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
        variant="modalConfirm"
        disabled={isLoading}
      >
        {isLoading ? "Creating..." : "Create Patient"}
      </Button>
    </div>
  );
};