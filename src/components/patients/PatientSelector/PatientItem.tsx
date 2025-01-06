import { Check } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Patient } from "@/types";

interface PatientItemProps {
  patient: Patient;
  isSelected: boolean;
  onSelect: (patient: Patient) => void;
  isLoading: boolean;
}

export const PatientItem = ({
  patient,
  isSelected,
  onSelect,
  isLoading,
}: PatientItemProps) => {
  return (
    <DropdownMenuItem
      className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-chatgpt-hover transition-colors"
      onClick={() => !isLoading && onSelect(patient)}
      disabled={isLoading}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{patient.name}</span>
          {isSelected && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </div>
        <div className="text-xs text-gray-400">
          DOB: {new Date(patient.dob).toLocaleDateString()}
        </div>
      </div>
    </DropdownMenuItem>
  );
};