import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import {
  StyledDialog,
  StyledDialogContent,
  StyledDialogHeader,
  StyledDialogFooter,
  StyledDialogTitle,
} from "@/components/ui/styled-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewPatientModal = ({ isOpen, onClose, onSuccess }: NewPatientModalProps) => {
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
      console.log('[NewPatientModal] Submitting new patient:', formData);
      
      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: formData.name,
          dob: formData.dob,
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
      onClose();
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

  return (
    <StyledDialog open={isOpen} onOpenChange={onClose}>
      <StyledDialogContent className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <StyledDialogHeader>
            <StyledDialogTitle>New Patient</StyledDialogTitle>
          </StyledDialogHeader>

          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-800"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="dob" className="text-sm font-medium">
                  Date of Birth *
                </label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-800"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-gray-800"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="bg-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="medicalHistory" className="text-sm font-medium">
                Medical History
              </label>
              <Textarea
                id="medicalHistory"
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleInputChange}
                className="bg-gray-800 min-h-[100px]"
              />
            </div>
          </div>

          <StyledDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Patient"}
            </Button>
          </StyledDialogFooter>
        </form>
      </StyledDialogContent>
    </StyledDialog>
  );
};