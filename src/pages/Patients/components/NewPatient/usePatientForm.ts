import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types';

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
  });

  useEffect(() => {
    if (existingPatient) {
      const contactInfo = existingPatient.contact_info as { email?: string; phone?: string } || {};
      setFormData({
        name: existingPatient.name || '',
        dob: existingPatient.dob || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        address: existingPatient.address || '',
        medicalHistory: existingPatient.medical_history || '',
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

      const patientData = {
        name: formData.name,
        dob: formData.dob,
        user_id: user.id,
        contact_info: {
          email: formData.email,
          phone: formData.phone,
        },
        address: formData.address,
        medical_history: formData.medicalHistory,
      };

      let result;
      
      if (existingPatient) {
        console.log('[PatientForm] Updating patient:', existingPatient.id, patientData);
        result = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', existingPatient.id)
          .select()
          .single();
      } else {
        console.log('[PatientForm] Creating new patient:', patientData);
        result = await supabase
          .from('patients')
          .insert(patientData)
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