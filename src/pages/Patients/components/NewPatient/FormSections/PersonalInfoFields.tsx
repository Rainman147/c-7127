import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PersonalInfoFieldsProps {
  name: string;
  dob: string;
  medications?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoFields = ({ 
  name, 
  dob,
  medications = '',
  onChange 
}: PersonalInfoFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onChange}
          placeholder="Enter patient's full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth *</Label>
        <Input
          id="dob"
          name="dob"
          value={dob}
          onChange={onChange}
          isDob={true}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="medications">Current Medications</Label>
        <Input
          id="medications"
          name="medications"
          value={medications}
          onChange={onChange}
          placeholder="Enter medications separated by commas"
        />
      </div>
    </div>
  );
};