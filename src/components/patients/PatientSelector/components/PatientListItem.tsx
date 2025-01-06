import { memo } from 'react';
import type { Patient } from '@/types';

interface PatientListItemProps {
  patient: Patient;
  isHighlighted: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

export const PatientListItem = memo(({ 
  patient, 
  isHighlighted,
  onSelect,
  onMouseEnter 
}: PatientListItemProps) => {
  console.log('[PatientListItem] Rendering:', { patientName: patient.name, isHighlighted });

  return (
    <button
      className={`w-full px-3 py-2 text-left text-sm text-white hover:bg-chatgpt-hover transition-colors ${
        isHighlighted ? 'bg-chatgpt-hover' : ''
      }`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <div className="font-medium">{patient.name}</div>
      <div className="text-xs text-gray-400">
        DOB: {new Date(patient.dob).toLocaleDateString()}
      </div>
    </button>
  );
});

PatientListItem.displayName = 'PatientListItem';