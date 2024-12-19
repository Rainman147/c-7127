import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import type { Patient } from '@/types/database/patients';
import type { Doctor } from '@/types/database/doctors';

interface TemplateData {
  patient?: Patient;
  doctor?: Doctor;
}

export const useTemplateData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getPatientData = async (patientId: string) => {
    setIsLoading(true);
    try {
      console.log('[useTemplateData] Getting patient data for:', patientId);
      
      const { data, error } = await supabase.functions.invoke('template-data', {
        body: { 
          action: 'getPatientData',
          patientId 
        }
      });

      if (error) throw error;
      console.log('[useTemplateData] Retrieved patient data:', data);
      return data.patient;
    } catch (error: any) {
      console.error('[useTemplateData] Error getting patient data:', error);
      toast({
        title: "Error",
        description: "Failed to load patient data. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getDoctorData = async () => {
    setIsLoading(true);
    try {
      console.log('[useTemplateData] Getting doctor data');
      
      const { data, error } = await supabase.functions.invoke('template-data', {
        body: { 
          action: 'getDoctorData'
        }
      });

      if (error) throw error;
      console.log('[useTemplateData] Retrieved doctor data:', data);
      return data.doctor;
    } catch (error: any) {
      console.error('[useTemplateData] Error getting doctor data:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor data. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllTemplateData = async (patientId: string): Promise<TemplateData> => {
    setIsLoading(true);
    try {
      console.log('[useTemplateData] Getting all template data for patient:', patientId);
      
      const { data, error } = await supabase.functions.invoke('template-data', {
        body: { 
          action: 'getAllTemplateData',
          patientId 
        }
      });

      if (error) throw error;
      console.log('[useTemplateData] Retrieved template data:', data);
      return data;
    } catch (error: any) {
      console.error('[useTemplateData] Error getting template data:', error);
      toast({
        title: "Error",
        description: "Failed to load template data. Please try again.",
        variant: "destructive",
      });
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    getPatientData,
    getDoctorData,
    getAllTemplateData
  };
};