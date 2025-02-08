
import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import type { Patient } from '@/types';
import { toFrontendPatient } from '@/utils/transforms';

const PATIENTS_PER_PAGE = 50;

export const usePatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchPatients = useCallback(async (search: string, startIndex: number = 0) => {
    console.log('[usePatientSearch] Fetching patients:', { search, startIndex });
    setIsLoading(true);

    try {
      let query = supabase
        .from('patients')
        .select('*')
        .order('last_accessed', { ascending: false })
        .range(startIndex, startIndex + PATIENTS_PER_PAGE - 1);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('[usePatientSearch] Fetched patients:', data?.length);
      
      const transformedPatients = (data || []).map(toFrontendPatient);
      
      if (startIndex === 0) {
        setPatients(transformedPatients);
      } else {
        setPatients(prev => [...prev, ...transformedPatients]);
      }
      
      setHasMore((data?.length || 0) === PATIENTS_PER_PAGE);
    } catch (err) {
      console.error('[usePatientSearch] Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      console.log('[usePatientSearch] Loading more patients');
      fetchPatients(debouncedSearch, patients.length);
    }
  }, [fetchPatients, debouncedSearch, patients.length, isLoading, hasMore]);

  useEffect(() => {
    console.log('[usePatientSearch] Search term changed:', debouncedSearch);
    fetchPatients(debouncedSearch);
  }, [debouncedSearch, fetchPatients]);

  return {
    searchTerm,
    setSearchTerm,
    patients,
    isLoading,
    hasMore,
    loadMore
  };
};
