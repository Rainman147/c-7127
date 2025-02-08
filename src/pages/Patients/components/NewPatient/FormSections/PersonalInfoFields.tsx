
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PersonalInfoFieldsProps {
  name: string;
  dob: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoFields = ({ 
  name, 
  dob,
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
          type="date"
          value={dob}
          onChange={onChange}
          required
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
};
