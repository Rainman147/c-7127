import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PatientFormFieldsProps {
  formData: {
    name: string;
    dob: string;
    email: string;
    phone: string;
    address: string;
    medicalHistory: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const PatientFormFields = ({ formData, handleInputChange }: PatientFormFieldsProps) => {
  return (
    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto modal-content-scrollbar">
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
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};