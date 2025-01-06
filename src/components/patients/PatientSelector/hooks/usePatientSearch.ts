import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import type { Patient } from '@/types';

export const usePatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchPatients = useCallback(async (term: string) => {
    if (!term.trim()) {
      setPatients([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[PatientSearch] Searching for patients with term:', term);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(10);

      if (error) throw error;

      console.log('[PatientSearch] Found patients:', data);
      setPatients(data || []);
    } catch (err) {
      console.error('[PatientSearch] Error searching patients:', err);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchPatients(debouncedSearch);
  }, [debouncedSearch, searchPatients]);

  return {
    searchTerm,
    setSearchTerm,
    patients,
    isLoading
  };
};