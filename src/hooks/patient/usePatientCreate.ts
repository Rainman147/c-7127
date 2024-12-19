import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/types/database';

export const usePatientCreate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addPatient = async (
    name: string,
    dob: string,
    contactInfo?: Json,
    medicalHistory?: string,
    currentMedications?: Json[],
    recentTests?: Json[],
    address?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'addPatient',
          name,
          dob,
          contactInfo,
          medicalHistory,
          currentMedications,
          recentTests,
          address
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient added successfully",
      });

      return data.patient;
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add patient",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    addPatient
  };
};