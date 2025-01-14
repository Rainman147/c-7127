import React from 'react';
import { Input } from "@/components/ui/input";

interface ContactFieldsProps {
  email: string;
  phone: string;
  address: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ContactFields = ({ email, phone, address, onChange }: ContactFieldsProps) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={onChange}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone *
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={onChange}
            required
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
          value={address}
          onChange={onChange}
        />
      </div>
    </>
  );
};