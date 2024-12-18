import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  name: string;
  dob: string;
  contact_info?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const usePatientManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addPatient = async (
    name: string,
    dob: string,
    contactInfo?: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('patient-management', {
        body: { 
          action: 'addPatient',
          name,
          dob,
          contactInfo
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
    addPatient,
    searchPatients,
    getPatient
  };
};