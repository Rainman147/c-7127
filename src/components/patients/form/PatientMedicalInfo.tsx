import { Textarea } from '@/components/ui/textarea';

interface PatientMedicalInfoProps {
  medicalHistory: string;
  onMedicalHistoryChange: (history: string) => void;
}

export const PatientMedicalInfo = ({
  medicalHistory,
  onMedicalHistoryChange
}: PatientMedicalInfoProps) => {
  return (
    <div>
      <label htmlFor="medicalHistory" className="form-label">
        Medical History
      </label>
      <Textarea
        id="medicalHistory"
        value={medicalHistory}
        onChange={(e) => onMedicalHistoryChange(e.target.value)}
        placeholder="Enter patient medical history"
        className="form-input min-h-[100px]"
      />
    </div>
  );
};