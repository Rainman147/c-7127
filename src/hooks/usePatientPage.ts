import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useToast } from "@/hooks/use-toast";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import type { Patient } from "@/types/database/patients";

export const usePatientPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();
  const { isLoading, searchPatients, deletePatient } = usePatientManagement();

  const loadPatients = useCallback(async () => {
    try {
      console.log('Fetching patients with query:', debouncedQuery);
      const results = await searchPatients(debouncedQuery);
      console.log('Patients fetched:', results);
      setPatients(results);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoad(false);
    }
  }, [debouncedQuery, searchPatients, toast]);

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

  return {
    searchQuery,
    patients,
    isLoading,
    isInitialLoad,
    isDialogOpen,
    selectedPatient,
    handleSearch,
    handlePatientClick,
    handleDeletePatient,
    handlePatientAdded,
    setIsDialogOpen,
  };
};