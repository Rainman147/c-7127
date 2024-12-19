import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from '../PatientForm';

interface PatientListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPatientAdded: () => void;
}

export const PatientListHeader = ({
  searchQuery,
  onSearchChange,
  onPatientAdded
}: PatientListHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Patient List</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2 bg-[#2F2F2F] hover:bg-[#404040]">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </DialogTrigger>
        <DialogContent className="menu-dialog">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm onSubmit={onPatientAdded} />
        </DialogContent>
      </Dialog>
    </div>
  );
};