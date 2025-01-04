import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useURLStateService } from '@/features/routing/services/urlStateService';
import type { Patient } from '@/types';

export const usePatientSelection = (onPatientSelect: (patientId: string | null) => void) => {
  const [searchParams] = useSearchParams();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { handlePatientChange } = useURLStateService(null);

  // Load patient details when patientId is in URL
  const loadPatientDetails = useCallback(async (patientId: string) => {
    try {
      setIsLoading(true);
      console.log('[PatientSelection] Loading patient details:', patientId);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;

      console.log('[PatientSelection] Loaded patient details:', data);
      setSelectedPatient(data);
    } catch (err) {
      console.error('[PatientSelection] Error loading patient:', err);
      setSelectedPatient(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle patient selection
  const handlePatientSelect = useCallback((patient: Patient | null) => {
    console.log('[PatientSelection] Patient selected:', patient);
    setSelectedPatient(patient);
    handlePatientChange(patient);
    onPatientSelect(patient?.id || null);
  }, [handlePatientChange, onPatientSelect]);

  // Initialize from URL params
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId && (!selectedPatient || selectedPatient.id !== patientId)) {
      loadPatientDetails(patientId);
    }
  }, [searchParams, selectedPatient, loadPatientDetails]);

  return {
    selectedPatient,
    isLoading,
    handlePatientSelect
  };
};