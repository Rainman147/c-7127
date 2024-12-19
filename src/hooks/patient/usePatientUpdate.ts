import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/types/database';

export const usePatientUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updatePatient = async (
    patientId: string,
    updates: {
      name?: string;
      dob?: string;
      contactInfo?: Json;
      medicalHistory?: string;
      currentMedications?: Json[];
      recentTests?: Json[];
      address?: string;
    }
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'updatePatient',
          patientId,
          ...updates
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient updated successfully",
      });

      return data.patient;
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update patient",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updatePatient
  };
};