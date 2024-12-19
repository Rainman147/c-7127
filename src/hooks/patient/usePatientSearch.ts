import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePatientSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchPatients = async (query: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'searchPatients',
          query
        }
      });

      if (error) throw error;
      return data.patients;
    } catch (error: any) {
      console.error('Error searching patients:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search patients",
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