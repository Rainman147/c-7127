import { Input } from '@/components/ui/input';

interface PatientContactInfoProps {
  email: string;
  phone: string;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
}

export const PatientContactInfo = ({ 
  email, 
  phone, 
  onEmailChange, 
  onPhoneChange 
}: PatientContactInfoProps) => {
  return (
    <>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone
        </label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </div>
    </>
  );
};