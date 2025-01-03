import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import type { Patient } from '@/types';

export const usePatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchPatients = useCallback(async (term: string) => {
    if (!term.trim()) {
      setPatients([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[PatientSearch] Searching for patients with term:', term);

      const { data, error: searchError } = await supabase
        .from('patients')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(10);

      if (searchError) throw searchError;

      console.log('[PatientSearch] Found patients:', data);
      setPatients(data || []);
    } catch (err) {
      console.error('[PatientSearch] Error searching patients:', err);
      setError('Failed to search patients');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to trigger search when debounced term changes
  useEffect(() => {
    searchPatients(debouncedSearch);
  }, [debouncedSearch, searchPatients]);

  return {
    searchTerm,
    setSearchTerm,
    patients,
    isLoading,
    error
  };
};