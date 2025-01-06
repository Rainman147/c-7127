import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Patient } from '@/types';

interface PatientSelectorTriggerProps {
  selectedPatient: Patient | null;
  isLoading: boolean;
}

export const PatientSelectorTrigger = memo(({ 
  selectedPatient, 
  isLoading 
}: PatientSelectorTriggerProps) => {
  console.log('[PatientSelectorTrigger] Rendering with:', { 
    hasPatient: !!selectedPatient, 
    isLoading 
  });

  return (
    <DropdownMenuTrigger 
      className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={isLoading}
    >
      <span className="whitespace-nowrap">
        {selectedPatient ? selectedPatient.name : 'Select Patient'}
      </span>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </DropdownMenuTrigger>
  );
});

PatientSelectorTrigger.displayName = 'PatientSelectorTrigger';