
import { Patient } from '@/types';

interface PatientMedicalInfoProps {
  patient: Patient | null;
  isNew?: boolean;
}

export const PatientMedicalInfo = ({ patient, isNew = false }: PatientMedicalInfoProps) => {
  if (isNew || !patient) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Medical Information</h2>
        <div className="p-4 border rounded-lg bg-white/5">
          <p className="text-gray-500 italic">Medical information will be displayed here</p>
        </div>
      </div>
    );
  }

  const medications = patient.currentMedications || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Medical Information</h2>
      <div className="p-4 border rounded-lg bg-white/5 space-y-4">
        {medications.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Current Medications</h3>
            <ul className="list-disc pl-4">
              {medications.map((med, index) => (
                <li key={index} className="text-gray-300">{med}</li>
              ))}
            </ul>
          </div>
        )}
        {patient.medicalHistory && (
          <div>
            <h3 className="font-semibold mb-2">Medical History</h3>
            <p className="text-gray-300">{patient.medicalHistory}</p>
          </div>
        )}
      </div>
    </div>
  );
};
