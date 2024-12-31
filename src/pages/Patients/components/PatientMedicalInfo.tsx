import { Patient } from '@/types';

interface PatientMedicalInfoProps {
  patient: Patient;
}

export const PatientMedicalInfo = ({ patient }: PatientMedicalInfoProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Medical Information</h2>
      <div className="p-4 border rounded-lg bg-white/5">
        {patient.medical_history && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Medical History</h3>
            <p>{patient.medical_history}</p>
          </div>
        )}
        {patient.current_medications && patient.current_medications.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Current Medications</h3>
            <ul className="list-disc pl-4">
              {patient.current_medications.map((med, index) => (
                <li key={index}>{med}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};