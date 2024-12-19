import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PatientSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const PatientSearch = ({ searchQuery, onSearchChange }: PatientSearchProps) => {
  return (
    <div className="relative mb-8">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Input
        type="text"
        placeholder="Search patients..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 bg-chatgpt-secondary/10 border-white/10 w-full rounded-xl h-12"
      />
    </div>
  );
};