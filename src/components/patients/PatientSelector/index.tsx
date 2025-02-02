import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PatientItem } from './PatientItem';
import { usePatientSearch } from './hooks/usePatientSearch';
import { usePatientSelection } from './hooks/usePatientSelection';
import { useUrlStateManager } from '@/hooks/useUrlStateManager';
import type { Patient } from '@/types';

interface PatientSelectorProps {
  onPatientSelect: (patientId: string | null) => void;
  selectedPatientId?: string | null;
}

export const PatientSelector = memo(({ onPatientSelect, selectedPatientId }: PatientSelectorProps) => {
  console.log('[PatientSelector] Initializing with selectedPatientId:', selectedPatientId);
  
  const { 
    searchTerm, 
    setSearchTerm, 
    patients, 
    isLoading: isSearching,
    hasMore,
    loadMore 
  } = usePatientSearch();

  const { selectedPatient, isLoading: isLoadingPatient, handlePatientSelect } = usePatientSelection(onPatientSelect);
  const { updatePatientId } = useUrlStateManager();
  const observerTarget = useRef(null);

  const handlePatientSelection = useCallback((patient: Patient | null) => {
    console.log('[PatientSelector] Patient selection triggered:', patient?.name);
    handlePatientSelect(patient);
    updatePatientId(patient?.id || null);
  }, [handlePatientSelect, updatePatientId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadMore]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoadingPatient}
      >
        <span className="whitespace-nowrap">
          {selectedPatient ? selectedPatient.name : 'Select Patient'}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {selectedPatient && (
          <>
            <DropdownMenuItem
              className="text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 cursor-pointer px-3 py-2 rounded-md"
              onClick={() => handlePatientSelection(null)}
            >
              Clear Selection
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-chatgpt-border/50 my-1" />
          </>
        )}
        <div className="px-3 py-2 border-b border-chatgpt-border">
          <input
            className="w-full bg-transparent border-0 outline-none text-sm text-white placeholder-gray-400"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {patients.map((patient) => (
            <PatientItem
              key={patient.id}
              patient={patient}
              isSelected={selectedPatient?.id === patient.id}
              onSelect={handlePatientSelection}
              isLoading={isLoadingPatient}
            />
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
          {hasMore && (
            <div ref={observerTarget} className="p-2 text-center">
              {isSearching ? (
                <span className="text-sm text-gray-400">Loading more...</span>
              ) : (
                <span className="text-sm text-gray-400">Scroll for more</span>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

PatientSelector.displayName = 'PatientSelector';