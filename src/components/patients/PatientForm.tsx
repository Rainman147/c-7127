import { useState, useEffect } from "react";
import { usePatientManagement } from "@/hooks/usePatientManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface PatientFormProps {
  patient?: any;
  onClose: () => void;
  onSubmit: () => void;
}

export const PatientForm = ({ patient, onClose, onSubmit }: PatientFormProps) => {
  const { toast } = useToast();
  const { addPatient, updatePatient } = usePatientManagement();
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    contact_info: {
      phone: "",
      email: "",
    },
    address: "",
    medical_history: "",
    current_medications: [],
    recent_tests: [],
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : "",
        contact_info: {
          phone: patient.contact_info?.phone || "",
          email: patient.contact_info?.email || "",
        },
        address: patient.address || "",
        medical_history: patient.medical_history || "",
        current_medications: patient.current_medications || [],
        recent_tests: patient.recent_tests || [],
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (patient) {
        await updatePatient(patient.id, formData);
        toast({
          title: "Success",
          description: "Patient updated successfully",
        });
      } else {
        await addPatient(formData);
        toast({
          title: "Success",
          description: "Patient added successfully",
        });
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: "Failed to save patient",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name *</label>
        <Input
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date of Birth *</label>
        <Input
          type="date"
          required
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input
          value={formData.contact_info.phone}
          onChange={(e) => setFormData({
            ...formData,
            contact_info: { ...formData.contact_info, phone: e.target.value }
          })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={formData.contact_info.email}
          onChange={(e) => setFormData({
            ...formData,
            contact_info: { ...formData.contact_info, email: e.target.value }
          })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Medical History</label>
        <Textarea
          value={formData.medical_history}
          onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {patient ? "Update" : "Add"} Patient
        </Button>
      </div>
    </form>
  );
};