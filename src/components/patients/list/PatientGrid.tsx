import { PatientCard } from "../PatientCard";
import { LoadingState } from "./LoadingState";
import { EmptyPatientState } from "./EmptyPatientState";
import { usePatientRealtime } from "@/hooks/patient/usePatientRealtime";
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
  // Set up realtime subscriptions
  usePatientRealtime();

  if (isLoading) {
    return <LoadingState />;
  }

  if (patients.length === 0) {
    return <EmptyPatientState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onClick={() => onPatientClick(patient)}
          onDelete={() => onPatientDelete(patient.id)}
        />
      ))}
    </div>
  );
};