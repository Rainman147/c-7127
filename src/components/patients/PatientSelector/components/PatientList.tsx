import { memo } from 'react';
import { PatientListItem } from './PatientListItem';
import type { Patient } from '@/types';

interface PatientListProps {
  patients: Patient[];
  isSearching: boolean;
  searchTerm: string;
  highlightedIndex: number;
  onSelect: (patient: Patient) => void;
  onHighlight: (index: number) => void;
}

export const PatientList = memo(({ 
  patients, 
  isSearching, 
  searchTerm, 
  highlightedIndex,
  onSelect,
  onHighlight
}: PatientListProps) => {
  console.log('[PatientList] Rendering with:', { 
    patientsCount: patients.length, 
    isSearching, 
    searchTerm 
  });

  if (isSearching) {
    return (
      <div className="px-3 py-4 text-sm text-gray-400 text-center">
        Searching...
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-gray-400 text-center">
        {searchTerm ? 'No patients found' : 'Type to search patients'}
      </div>
    );
  }

  return (
    <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-chatgpt-border hover:scrollbar-thumb-chatgpt-border/80 scrollbar-track-chatgpt-main">
      {patients.map((patient, index) => (
        <PatientListItem
          key={patient.id}
          patient={patient}
          isHighlighted={index === highlightedIndex}
          onSelect={() => onSelect(patient)}
          onMouseEnter={() => onHighlight(index)}
        />
      ))}
    </div>
  );
});

PatientList.displayName = 'PatientList';