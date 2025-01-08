import { memo } from "react";
import { TemplateSelector } from "@/components/TemplateSelector";
import { PatientSelector } from "@/components/patients/PatientSelector";
import { useUI } from "@/contexts/UIContext";
import type { Template } from "@/components/template/types";

interface ChatHeaderProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
  onPatientSelect: (patientId: string | null) => Promise<void>;
  selectedPatientId: string | null;
}

const ChatHeaderComponent = ({ 
  currentChatId,
  onTemplateChange,
  onPatientSelect,
  selectedPatientId
}: ChatHeaderProps) => {
  const { isSidebarOpen } = useUI();
  
  console.log('[ChatHeader] Rendering with:', { 
    isSidebarOpen, 
    currentChatId,
    selectedPatientId,
    hasTemplateChangeHandler: !!onTemplateChange,
    hasPatientSelectHandler: !!onPatientSelect
  });

  return (
    <header className="fixed top-0 z-30 w-full bg-chatgpt-main/95 backdrop-blur supports-[backdrop-filter]:bg-chatgpt-main/75">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className={`${!isSidebarOpen ? 'ml-24' : ''} transition-all duration-200`}>
            <TemplateSelector 
              key={currentChatId || 'default'}
              currentChatId={currentChatId}
              onTemplateChange={onTemplateChange}
            />
          </div>
          <PatientSelector 
            onPatientSelect={onPatientSelect}
            selectedPatientId={selectedPatientId}
          />
        </div>
      </div>
    </header>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';