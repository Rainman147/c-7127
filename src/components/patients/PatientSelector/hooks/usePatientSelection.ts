
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { calculateAge, formatPatientContext } from '@/types/patient';
import type { Patient, PatientContext } from '@/types';
import { toFrontendPatient } from '@/utils/transforms';

interface UsePatientSelectionReturn {
  selectedPatient: Patient | null;
  patientContext: PatientContext | null;
  isLoading: boolean;
  error: Error | null;
  handlePatientSelect: (patient: Patient | null) => void;
}

export const usePatientSelection = (
  onPatientSelect: (patientId: string | null) => void
): UsePatientSelectionReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPatientDetails = useCallback(async (patientId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[PatientSelection] Loading patient details:', patientId);

      const { data, error: fetchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('Patient not found');
      }

      console.log('[PatientSelection] Loaded patient details:', data);
      const transformedPatient = toFrontendPatient(data);
      setSelectedPatient(transformedPatient);

      // Format patient context
      const formattedContext = formatPatientContext(transformedPatient);
      setPatientContext(formattedContext);
      
    } catch (err) {
      console.error('[PatientSelection] Error loading patient:', err);
      setError(err instanceof Error ? err : new Error('Failed to load patient'));
      setSelectedPatient(null);
      setPatientContext(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = useCallback((patient: Patient | null) => {
    console.log('[PatientSelection] Patient selected:', patient);
    setSelectedPatient(patient);
    
    if (patient) {
      // Update patient context when patient is selected
      const formattedContext = formatPatientContext(patient);
      setPatientContext(formattedContext);
      
      // Update URL parameters while maintaining existing ones
      const newParams = new URLSearchParams(searchParams);
      newParams.set('patientId', patient.id);
      setSearchParams(newParams);
    } else {
      // Clear patient context when no patient is selected
      setPatientContext(null);
      
      // Remove patientId from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('patientId');
      setSearchParams(newParams);
    }
    
    // Notify parent component
    onPatientSelect(patient?.id || null);
  }, [searchParams, setSearchParams, onPatientSelect]);

  // Initialize from URL params
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && (!selectedPatient || selectedPatient.id !== patientId)) {
      loadPatientDetails(patientId);
    } else if (!patientId && selectedPatient) {
      // Clear selection if patientId is removed from URL
      setSelectedPatient(null);
      setPatientContext(null);
    }
  }, [searchParams, selectedPatient, loadPatientDetails]);

  return {
    selectedPatient,
    patientContext,
    isLoading,
    error,
    handlePatientSelect
  };
};
