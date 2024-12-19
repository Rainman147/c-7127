import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientDialog } from "@/components/patients/PatientDialog";
import { PatientListHeader } from "@/components/patients/list/PatientListHeader";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import type { Patient } from "@/types/database/patients";

const PatientsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isLoading, searchPatients, deletePatient } = usePatientManagement();

  useEffect(() => {
    const loadPatients = async () => {
      try {
        console.log('Fetching patients...');
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
    };

    loadPatients();
  }, [searchQuery, toast, searchPatients]);

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
    try {
      const results = await searchPatients("");
      setPatients(results);
      toast({
        title: "Success",
        description: "Patient added successfully",
      });
    } catch (error) {
      console.error('Error refreshing patients:', error);
      toast({
        title: "Error",
        description: "Failed to refresh patient list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PatientListHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onPatientAdded={handlePatientAdded}
      />

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-chatgpt-secondary/10 border-white/10 w-full rounded-xl h-12"
        />
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-400">
            Loading patients...
          </div>
        ) : patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => handlePatientClick(patient)}
              onDelete={() => handleDeletePatient(patient.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400">
            No patients found. Try a different search.
          </div>
        )}
      </div>

      {/* Patient Details Dialog */}
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