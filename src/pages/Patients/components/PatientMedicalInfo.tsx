import { Patient } from '@/types';
import { parseSupabaseJson } from '@/types';

interface PatientMedicalInfoProps {
  patient: Patient;
}

export const PatientMedicalInfo = ({ patient }: PatientMedicalInfoProps) => {
  const medications = parseSupabaseJson<string[]>(patient.current_medications) || [];
  console.log('[PatientMedicalInfo] Parsed medications:', medications);

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
        {medications && medications.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Current Medications</h3>
            <ul className="list-disc pl-4">
              {medications.map((med, index) => (
                <li key={index}>{med}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};