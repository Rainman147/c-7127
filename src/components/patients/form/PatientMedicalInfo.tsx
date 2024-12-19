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
      <label htmlFor="medicalHistory" className="block text-sm font-medium">
        Medical History
      </label>
      <Textarea
        id="medicalHistory"
        value={medicalHistory}
        onChange={(e) => onMedicalHistoryChange(e.target.value)}
        rows={4}
      />
    </div>
  );
};