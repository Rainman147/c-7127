import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePatientDelete = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const deletePatient = async (patientId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'deletePatient',
          patientId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    deletePatient
  };
};