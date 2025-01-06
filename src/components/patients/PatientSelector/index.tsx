import { memo, useCallback, useState } from 'react';
import { usePatientSearch } from './hooks/usePatientSearch';
import { usePatientSelection } from './hooks/usePatientSelection';
import { PatientSelectorTrigger } from './PatientSelectorTrigger';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search } from 'lucide-react';
import type { Patient } from '@/types';

interface PatientSelectorProps {
  onPatientSelect: (patientId: string | null) => void;
}

export const PatientSelector = memo(({ onPatientSelect }: PatientSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { searchTerm, setSearchTerm, patients, isLoading: isSearching } = usePatientSearch();
  const { selectedPatient, isLoading: isLoadingPatient, handlePatientSelect } = usePatientSelection(onPatientSelect);

  const handleSelect = useCallback((patient: Patient | null) => {
    handlePatientSelect(patient);
    setIsOpen(false);
  }, [handlePatientSelect]);

  console.log('[PatientSelector] Rendering with:', { 
    isOpen, 
    patientsCount: patients.length,
    hasSelectedPatient: !!selectedPatient 
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <PatientSelectorTrigger
          selectedPatient={selectedPatient}
          isLoading={isLoadingPatient}
          onClick={() => setIsOpen(true)}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-chatgpt-main border border-chatgpt-border"
        align="start"
      >
        <div className="flex items-center px-3 py-2 border-b border-chatgpt-border">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-gray-400 ml-2"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {patients.map((patient) => (
            <button
              key={patient.id}
              className="w-full px-3 py-2 text-left text-sm text-white hover:bg-chatgpt-hover transition-colors"
              onClick={() => handleSelect(patient)}
            >
              <div className="font-medium">{patient.name}</div>
              <div className="text-xs text-gray-400">
                DOB: {new Date(patient.dob).toLocaleDateString()}
              </div>
            </button>
          ))}
          {isSearching && (
            <div className="px-3 py-2 text-sm text-gray-400">
              Searching...
            </div>
          )}
          {!isSearching && searchTerm && patients.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">
              No patients found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

PatientSelector.displayName = 'PatientSelector';