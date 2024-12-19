import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePatientManagement } from '@/hooks/usePatientManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Json } from '@/types/database';

export const PatientForm = () => {
  const { toast } = useToast();
  const { addPatient } = usePatientManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [contactInfo, setContactInfo] = useState<Json>({
    email: '',
    phone: '',
  });
  const [currentMedications, setCurrentMedications] = useState<Json[]>([]);
  const [recentTests, setRecentTests] = useState<Json[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await addPatient(
        name,
        dob,
        contactInfo,
        medicalHistory,
        currentMedications,
        recentTests,
        address
      );

      if (result) {
        toast({
          title: "Success",
          description: "Patient added successfully",
          variant: "default"
        });
        // Reset form
        setName('');
        setDob('');
        setAddress('');
        setMedicalHistory('');
        setContactInfo({ email: '', phone: '' });
        setCurrentMedications([]);
        setRecentTests([]);
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="dob" className="block text-sm font-medium">
          Date of Birth
        </label>
        <Input
          id="dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={contactInfo.email as string}
          onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone
        </label>
        <Input
          id="phone"
          type="tel"
          value={contactInfo.phone as string}
          onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Address
        </label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="medicalHistory" className="block text-sm font-medium">
          Medical History
        </label>
        <Textarea
          id="medicalHistory"
          value={medicalHistory}
          onChange={(e) => setMedicalHistory(e.target.value)}
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding Patient...' : 'Add Patient'}
      </Button>
    </form>
  );
};