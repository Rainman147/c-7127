import { Input } from '@/components/ui/input';

interface PatientBasicInfoProps {
  name: string;
  dob: string;
  address: string;
  onNameChange: (name: string) => void;
  onDobChange: (dob: string) => void;
  onAddressChange: (address: string) => void;
}

export const PatientBasicInfo = ({
  name,
  dob,
  address,
  onNameChange,
  onDobChange,
  onAddressChange
}: PatientBasicInfoProps) => {
  return (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
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
          onChange={(e) => onDobChange(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Address
        </label>
        <Input
          id="address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>
    </>
  );
};