import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePatientDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getPatient = async (patientId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'getPatient',
          patientId
        }
      });

      if (error) throw error;
      return data.patient;
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch patient",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getPatient
  };
};