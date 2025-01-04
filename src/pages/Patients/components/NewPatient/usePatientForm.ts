import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

export const usePatientForm = (onSuccess?: () => void, onClose?: () => void) => {
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

      console.log('[NewPatientModal] Submitting new patient:', formData);
      
      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: formData.name,
          dob: formData.dob,
          user_id: user.id,
          contact_info: {
            email: formData.email,
            phone: formData.phone,
          },
          address: formData.address,
          medical_history: formData.medicalHistory,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[NewPatientModal] Successfully created patient:', data);
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('[NewPatientModal] Error creating patient:', error);
      toast({
        title: "Error",
        description: "Failed to create patient. Please try again.",
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