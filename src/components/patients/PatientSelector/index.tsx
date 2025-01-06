import { memo, useCallback, useState, KeyboardEvent } from 'react';
import { usePatientSearch } from './hooks/usePatientSearch';
import { usePatientSelection } from './hooks/usePatientSelection';
import { PatientSelectorTrigger } from './PatientSelectorTrigger';
import { SearchInput } from './components/SearchInput';
import { PatientList } from './components/PatientList';
import {
  DropdownMenu,
  DropdownMenuContent,
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
    console.log('[PatientSelector] Patient selected:', patient?.name);
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

  const handleOpenChange = useCallback((open: boolean) => {
    console.log('[PatientSelector] Dropdown state changed:', open);
    setIsOpen(open);
    if (!open) {
      setHighlightedIndex(-1);
      setSearchTerm('');
    }
  }, [setSearchTerm]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <PatientSelectorTrigger
        selectedPatient={selectedPatient}
        isLoading={isLoadingPatient}
      />
      <DropdownMenuContent 
        className="w-72 p-0 gap-0 bg-chatgpt-main border-chatgpt-border animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        align="start"
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        collisionPadding={16}
        avoidCollisions={true}
        onKeyDown={handleKeyDown}
      >
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <PatientList
          patients={patients}
          isSearching={isSearching}
          searchTerm={searchTerm}
          highlightedIndex={highlightedIndex}
          onSelect={handleSelect}
          onHighlight={setHighlightedIndex}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

PatientSelector.displayName = 'PatientSelector';