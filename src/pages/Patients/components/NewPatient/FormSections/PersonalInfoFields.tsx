import React from 'react';
import { Input } from "@/components/ui/input";

interface PersonalInfoFieldsProps {
  name: string;
  dob: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoFields = ({ name, dob, onChange }: PersonalInfoFieldsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Full Name *
        </label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onChange}
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
          value={dob}
          onChange={onChange}
          required
        />
      </div>
    </div>
  );
};