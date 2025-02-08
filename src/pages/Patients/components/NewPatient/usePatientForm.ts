
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types';
import { toDatabasePatient } from '@/utils/transforms';
import { CurrentMedications } from '@/types/database';

export const usePatientForm = (
  onSuccess?: () => void, 
  onClose?: () => void,
  existingPatient?: Patient | null
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    email: '',
    phone: '',
    address: '',
    medicalHistory: '',
    medications: '',
  });

  useEffect(() => {
    if (existingPatient) {
      const contactInfo = existingPatient.contactInfo || {};
      const currentMedications = Array.isArray(existingPatient.currentMedications) 
        ? existingPatient.currentMedications.map(med => 
            typeof med === 'string' ? med : med.name
          ).join('\n')
        : '';
        
      setFormData({
        name: existingPatient.name || '',
        dob: existingPatient.dob || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        address: existingPatient.address || '',
        medicalHistory: existingPatient.medicalHistory || '',
        medications: currentMedications,
      });
    }
  }, [existingPatient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user found');

      const medications: CurrentMedications = formData.medications
        .split('\n')
        .map(med => med.trim())
        .filter(med => med.length > 0)
        .map(name => ({
          name,
          dosage: 'Not specified',
          frequency: 'Not specified'
        }));

      const patientData = {
        name: formData.name,
        dob: formData.dob,
        userId: user.id,
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
        },
        address: formData.address,
        medicalHistory: formData.medicalHistory,
        currentMedications: medications
      };

      let result;
      
      if (existingPatient) {
        console.log('[PatientForm] Updating patient:', existingPatient.id, patientData);
        const dbPatient = toDatabasePatient(patientData);
        result = await supabase
          .from('patients')
          .update(dbPatient)
          .eq('id', existingPatient.id)
          .select()
          .single();
      } else {
        console.log('[PatientForm] Creating new patient:', patientData);
        const dbPatient = toDatabasePatient({
          ...patientData,
          dob: formData.dob
        });
        result = await supabase
          .from('patients')
          .insert(dbPatient)
          .select()
          .single();
      }

      const { data, error } = result;
      if (error) throw error;

      console.log('[PatientForm] Success:', data);
      toast({
        title: "Success",
        description: existingPatient 
          ? "Patient updated successfully"
          : "Patient created successfully",
      });
      
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('[PatientForm] Error:', error);
      toast({
        title: "Error",
        description: existingPatient
          ? "Failed to update patient. Please try again."
          : "Failed to create patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleInputChange,
    handleSubmit,
  };
};

