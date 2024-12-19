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
    <div className="space-y-4">
      <div>
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter patient email"
        />
      </div>

      <div>
        <label htmlFor="phone" className="form-label">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          className="form-input"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Enter patient phone number"
        />
      </div>
    </div>
  );
};