import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient } from "@/types/database/patients";

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
  onDelete: () => void;
}

export const PatientCard = ({ patient, onClick, onDelete }: PatientCardProps) => {
  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'N/A';
    }
  };

  // Safely get patient initials
  const getInitials = (name: string) => {
    try {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
    } catch (error) {
      console.error('Error getting initials:', error);
      return '';
    }
  };

  // Early return if patient data is invalid
  if (!patient || !patient.name || !patient.dob) {
    console.error('Invalid patient data:', patient);
    return null;
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold">
            {patient.contact_info?.avatar ? (
              <img 
                src={patient.contact_info.avatar} 
                alt={patient.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </div>

        {/* Patient Info */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
            {patient.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Age: {calculateAge(patient.dob)} years
          </p>
          {patient.medical_history && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {patient.medical_history}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};