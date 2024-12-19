import { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/types/database/patients';

export const usePatientSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchPatients = useCallback(async (query: string): Promise<Patient[]> => {
    console.log('Calling searchPatients with query:', query);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'searchPatients',
          query
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        setError(error.message);
        throw error;
      }

      if (!data?.patients) {
        console.error('Invalid response format:', data);
        setError('Invalid response from server');
        throw new Error('Invalid response from server');
      }
      
      console.log('Search results:', data);
      return data.patients;
    } catch (error: any) {
      console.error('Error searching patients:', error);
      setError(error.message || "Failed to load patient data");
      toast({
        title: "Error Loading Patients",
        description: error.message || "Failed to load patient data. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    error,
    searchPatients
  };
};