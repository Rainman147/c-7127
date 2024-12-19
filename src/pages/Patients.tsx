import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientDialog } from "@/components/patients/PatientDialog";
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
    if (window.confirm("Are you sure you want to delete this patient?")) {
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

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Patients</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-chatgpt-secondary/10 border-white/10 w-full"
          />
        </div>
      </div>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading patients...</div>
      ) : patients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => handlePatientClick(patient)}
              onDelete={() => handleDelete(patient.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          No patients found. Try a different search.
        </div>
      )}

      <PatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        patient={selectedPatient}
        onClose={() => {
          setSelectedPatient(undefined);
          setIsDialogOpen(false);
        }}
        onSubmit={() => {
          handleSearch(searchQuery);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
};

export default PatientsPage;