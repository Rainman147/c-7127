import { PatientCard } from "../PatientCard";
import type { Patient } from "@/types/database/patients";

interface PatientGridProps {
  patients: Patient[];
  isLoading: boolean;
  onPatientClick: (patient: Patient) => void;
  onPatientDelete: (patientId: string) => void;
}

export const PatientGrid = ({
  patients,
  isLoading,
  onPatientClick,
  onPatientDelete,
}: PatientGridProps) => {
  return (
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
            onClick={() => onPatientClick(patient)}
            onDelete={() => onPatientDelete(patient.id)}
          />
        ))
      ) : (
        <div className="col-span-full text-center text-gray-400">
          No patients found. Try a different search.
        </div>
      )}
    </div>
  );
};