import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface MedicalHistoryFieldProps {
  medicalHistory: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const MedicalHistoryField = ({ medicalHistory, onChange }: MedicalHistoryFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="medicalHistory" className="text-sm font-medium">
        Medical History
      </label>
      <Textarea
        id="medicalHistory"
        name="medicalHistory"
        value={medicalHistory}
        onChange={onChange}
        className="min-h-[100px]"
      />
    </div>
  );
};