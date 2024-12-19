import { Key } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SidebarFooterProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const SidebarFooter = ({ apiKey, onApiKeyChange }: SidebarFooterProps) => {
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
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="bg-[#2F2F2F] border-none rounded-xl"
        />
      </div>
    </div>
  );
};