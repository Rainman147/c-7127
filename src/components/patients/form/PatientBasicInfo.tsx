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
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="form-label">
          Name
        </label>
        <input
          id="name"
          className="form-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter patient name"
          required
        />
      </div>

      <div>
        <label htmlFor="dob" className="form-label">
          Date of Birth
        </label>
        <input
          id="dob"
          type="date"
          className="form-input"
          value={dob}
          onChange={(e) => onDobChange(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="address" className="form-label">
          Address
        </label>
        <input
          id="address"
          className="form-input"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Enter patient address"
        />
      </div>
    </div>
  );
};