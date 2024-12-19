import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PatientDialog } from "@/components/patients/PatientDialog";
import { PatientListHeader } from "@/components/patients/list/PatientListHeader";
import { PatientSearch } from "@/components/patients/list/PatientSearch";
import { PatientGrid } from "@/components/patients/list/PatientGrid";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import type { Patient } from "@/types/database/patients";

const PatientsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isLoading, searchPatients, deletePatient } = usePatientManagement();

  // Memoize the loadPatients function to prevent unnecessary re-renders
  const loadPatients = useCallback(async () => {
    try {
      console.log('Fetching patients with query:', searchQuery);
      const results = await searchPatients(searchQuery);
      console.log('Patients fetched:', results);
      setPatients(results);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    }
  }, [searchQuery, searchPatients, toast]);

  // Only run the effect when searchQuery changes or loadPatients is redefined
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await deletePatient(patientId);
      setPatients(patients.filter(patient => patient.id !== patientId));
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
  };

  const handlePatientAdded = async () => {
    await loadPatients();
    toast({
      title: "Success",
      description: "Patient added successfully",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PatientListHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onPatientAdded={handlePatientAdded}
      />

      <PatientSearch 
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      <PatientGrid
        patients={patients}
        isLoading={isLoading}
        onPatientClick={handlePatientClick}
        onPatientDelete={handleDeletePatient}
      />

      <PatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        patient={selectedPatient}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handlePatientAdded}
      />
    </div>
  );
};

export default PatientsPage;