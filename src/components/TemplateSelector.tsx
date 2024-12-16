import { useState, useEffect } from "react";
import { Check, ChevronDown, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type Template = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
};

const templates: Template[] = [
  {
    id: "live-session",
    name: "Live Patient Session",
    description: "Real-time session with focus on symptoms and immediate observations",
    systemInstructions: "Prioritize extracting symptoms, diagnoses, treatments, and test recommendations. Ignore non-relevant data unless a pattern emerges."
  },
  {
    id: "soap-standard",
    name: "SOAP Note (Standard)",
    description: "Structured format for patient encounters",
    systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans."
  },
  {
    id: "soap-expanded",
    name: "SOAP Note (Expanded)",
    description: "Detailed SOAP format with additional sections",
    systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans."
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Comprehensive discharge documentation",
    systemInstructions: "Focus on admission details, hospital course, and discharge instructions."
  },
  {
    id: "referral",
    name: "Referral Letter",
    description: "Specialist referral documentation",
    systemInstructions: "Emphasize reason for referral, relevant history, and specific consultation requests."
  }
];

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

export const TemplateSelector = ({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const { toast } = useToast();

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) return;

      try {
        const { data, error } = await supabase
          .from('chats')
          .select('template_type')
          .eq('id', currentChatId)
          .single();

        if (error) throw error;

        if (data?.template_type) {
          const template = templates.find(t => t.id === data.template_type);
          if (template) {
            setSelectedTemplate(template);
          }
        }
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };

    loadTemplateForChat();
  }, [currentChatId]);

  const handleTemplateChange = async (template: Template) => {
    if (currentChatId && template.id !== selectedTemplate.id) {
      try {
        const { error } = await supabase
          .from('chats')
          .update({ template_type: template.id })
          .eq('id', currentChatId);

        if (error) throw error;

        setSelectedTemplate(template);
        onTemplateChange(template);

        toast({
          title: "Template Changed",
          description: `Now using: ${template.name}`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
        {selectedTemplate.name}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-chatgpt-secondary border border-chatgpt-border">
        {templates.map((template) => (
          <TooltipProvider key={template.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
                    selectedTemplate.id === template.id ? 'bg-chatgpt-hover' : ''
                  }`}
                  onClick={() => handleTemplateChange(template)}
                >
                  <span className="flex items-center gap-2">
                    {template.name}
                    <Info className="h-4 w-4 text-gray-400" />
                  </span>
                  {selectedTemplate.id === template.id && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <p>{template.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplateSelector;