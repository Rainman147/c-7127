import { useState } from "react";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/patients/PatientForm";
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient List</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          placeholder="Search patients..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.name}</TableCell>
                <TableCell>
                  {patient.dob ? format(new Date(patient.dob), 'MM/dd/yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  {(patient.contact_info as { phone: string })?.phone || 'N/A'}
                </TableCell>
                <TableCell>
                  {(patient.contact_info as { email: string })?.email || 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(patient)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(patient.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {isLoading ? "Loading..." : "No patients found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PatientsPage;