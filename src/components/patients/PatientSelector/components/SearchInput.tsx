import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({ value, onChange }: SearchInputProps) => {
  console.log('[SearchInput] Rendering with value:', value);
  
  return (
    <div className="flex items-center px-3 py-2 border-b border-chatgpt-border">
      <Search className="h-4 w-4 text-gray-400" />
      <input
        className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-gray-400 ml-2"
        placeholder="Search patients..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </div>
  );
};