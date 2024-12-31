import { useState } from 'react';
import { Key } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SidebarFooterProps {
  onApiKeyChange: (apiKey: string) => void;
}

const SidebarFooter = ({ onApiKeyChange }: SidebarFooterProps) => {
  const [apiKey, setApiKey] = useState("");

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    onApiKeyChange(newApiKey);
  };

  return (
    <div className="mt-auto border-t border-chatgpt-border pt-4 pb-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4" />
          <span className="text-sm">API Key</span>
        </div>
        <Input
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={handleApiKeyChange}
          className="bg-[#2F2F2F] border-none rounded-xl"
        />
      </div>
    </div>
  );
};

export default SidebarFooter;