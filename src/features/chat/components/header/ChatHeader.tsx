import { memo } from "react";
import { TemplateSelector } from "@/components/TemplateSelector";
import { PatientSelector } from "@/components/patients/PatientSelector";
import { useUI } from "@/contexts/UIContext";
import type { Template } from "@/types";

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
  
  const handleTemplateChange = (template: Template) => {
    console.log('[ChatHeader] Template change requested:', template);
    onTemplateChange(template);
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[ChatHeader] Patient selection changed:', patientId);
    await onPatientSelect(patientId);
  };

  return (
    <div className="fixed top-0 z-30 w-full border-b border-white/20 bg-chatgpt-main/95 backdrop-blur">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className={`${!isSidebarOpen ? 'ml-24' : ''}`}>
            <TemplateSelector 
              key={currentChatId || 'default'}
              currentChatId={currentChatId}
              onTemplateChange={handleTemplateChange}
            />
          </span>
          <PatientSelector onPatientSelect={handlePatientSelect} />
        </div>
      </div>
    </div>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';