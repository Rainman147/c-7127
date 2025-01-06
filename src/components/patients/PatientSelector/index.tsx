import { memo, useCallback, useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { usePatientSearch } from './hooks/usePatientSearch';
import { usePatientSelection } from './hooks/usePatientSelection';
import { PatientSelectorTrigger } from './PatientSelectorTrigger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Patient } from '@/types';

interface PatientSelectorProps {
  onPatientSelect: (patientId: string | null) => void;
}

export const PatientSelector = memo(({ onPatientSelect }: PatientSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const { searchTerm, setSearchTerm, patients, isLoading: isSearching } = usePatientSearch();
  const { selectedPatient, isLoading: isLoadingPatient, handlePatientSelect } = usePatientSelection(onPatientSelect);

  const handleSelect = useCallback((patient: Patient | null) => {
    handlePatientSelect(patient);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [handlePatientSelect]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < patients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : prev
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < patients.length) {
          handleSelect(patients[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  console.log('[PatientSelector] Rendering with:', { 
    isOpen, 
    patientsCount: patients.length,
    hasSelectedPatient: !!selectedPatient,
    highlightedIndex
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <PatientSelectorTrigger
          selectedPatient={selectedPatient}
          isLoading={isLoadingPatient}
          onClick={() => setIsOpen(true)}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[280px] p-0 gap-0 bg-chatgpt-main border-chatgpt-border animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        align="start"
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        collisionPadding={16}
        avoidCollisions={true}
        onKeyDown={handleKeyDown}
        role="listbox"
        aria-label="Select a patient"
      >
        <div className="flex items-center px-3 py-2 border-b border-chatgpt-border">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-gray-400 ml-2"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search patients"
            autoFocus
          />
        </div>
        <div 
          className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-chatgpt-border hover:scrollbar-thumb-chatgpt-border/80 scrollbar-track-chatgpt-main"
          role="presentation"
        >
          {isSearching ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center" role="status">
              Searching...
            </div>
          ) : patients.length > 0 ? (
            patients.map((patient, index) => (
              <button
                key={patient.id}
                className={`w-full px-3 py-2 text-left text-sm text-white hover:bg-chatgpt-hover transition-colors ${
                  index === highlightedIndex ? 'bg-chatgpt-hover' : ''
                }`}
                onClick={() => handleSelect(patient)}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{patient.name}</div>
                <div className="text-xs text-gray-400">
                  DOB: {new Date(patient.dob).toLocaleDateString()}
                </div>
              </button>
            ))
          ) : searchTerm ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center" role="status">
              No patients found
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-400 text-center" role="status">
              Type to search patients
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

PatientSelector.displayName = 'PatientSelector';