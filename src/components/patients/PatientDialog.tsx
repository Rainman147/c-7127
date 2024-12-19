import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "./PatientForm";
import type { Patient } from "@/types/database/patients";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  onClose: () => void;
  onSubmit: () => void;
}

export const PatientDialog = ({
  open,
  onOpenChange,
  patient,
  onClose,
  onSubmit,
}: PatientDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="menu-dialog">
        <DialogHeader className="menu-dialog-header">
          <DialogTitle className="menu-dialog-title">
            {patient ? "Edit Patient" : "Add New Patient"}
          </DialogTitle>
        </DialogHeader>
        <PatientForm
          patient={patient}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
};