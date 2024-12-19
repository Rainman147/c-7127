import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/types/database/patients';

export const usePatientSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchPatients = async (query: string): Promise<Patient[]> => {
    console.log('Calling searchPatients with query:', query);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'searchPatients',
          query
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.patients) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from server');
      }
      
      console.log('Search results:', data);
      return data.patients;
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast({
        title: "Error Loading Patients",
        description: error.message || "Failed to load patient data. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    searchPatients
  };
};