import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientListHeader } from "@/components/patients/list/PatientListHeader";
import { PatientListTable } from "@/components/patients/list/PatientListTable";
import type { Patient } from "@/types/database/patients";

const PatientsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { isLoading, searchPatients, deletePatient } = usePatientManagement();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const results = await searchPatients(query);
      setPatients(results);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast({
        title: "Error",
        description: "Failed to search patients",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (patientId: string) => {
    if (window.confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      try {
        await deletePatient(patientId);
        setPatients(patients.filter(p => p.id !== patientId));
        toast({
          title: "Success",
          description: "Patient deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting patient:', error);
        toast({
          title: "Error",
          description: "Failed to delete patient",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleFormClose = () => {
    setSelectedPatient(undefined);
    setIsDialogOpen(false);
  };

  const handleFormSubmit = async () => {
    // Refresh the patient list after form submission
    handleSearch(searchQuery);
    handleFormClose();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PatientListHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onPatientAdded={() => handleSearch(searchQuery)}
      />

      <div className="relative mb-6">
        <PatientListTable
          patients={patients}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient ? "Edit Patient" : "Add New Patient"}
            </DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={selectedPatient}
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientsPage;