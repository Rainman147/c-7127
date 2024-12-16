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
    description: "Real-time session with focus on symptoms and immediate observations. Perfect for capturing patient interactions as they happen.",
    systemInstructions: "Prioritize extracting symptoms, diagnoses, treatments, and test recommendations. Ignore non-relevant data unless a pattern emerges."
  },
  {
    id: "soap-standard",
    name: "SOAP Note (Standard)",
    description: "Structured format for patient encounters following the classic SOAP methodology: Subjective, Objective, Assessment, Plan.",
    systemInstructions: "Format output in SOAP format: Subjective, Objective, Assessment, Plan. Focus on clinical findings and treatment plans."
  },
  {
    id: "soap-expanded",
    name: "SOAP Note (Expanded)",
    description: "Comprehensive SOAP format including detailed vital signs, lab results, and extensive treatment planning sections.",
    systemInstructions: "Use expanded SOAP format including vital signs, lab results, and detailed treatment plans."
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Complete discharge documentation including admission details, hospital course, and detailed follow-up instructions.",
    systemInstructions: "Focus on admission details, hospital course, and discharge instructions."
  },
  {
    id: "referral",
    name: "Referral Letter",
    description: "Professional specialist referral documentation with emphasis on reason for referral and relevant clinical history.",
    systemInstructions: "Emphasize reason for referral, relevant history, and specific consultation requests."
  }
];

interface TemplateSelectorProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
}

const TemplateSelector = ({ currentChatId, onTemplateChange }: TemplateSelectorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadTemplateForChat = async () => {
      if (!currentChatId) {
        setSelectedTemplate(templates[0]);
        return;
      }

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
            console.log('Setting template from database:', template.name);
            setSelectedTemplate(template);
          }
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      }
    };

    loadTemplateForChat();
  }, [currentChatId]);

  const handleTemplateChange = async (template: Template) => {
    console.log('Handling template change to:', template.name);
    if (!currentChatId || template.id === selectedTemplate.id) return;

    setIsLoading(true);
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
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="flex items-center gap-2 px-3 py-1 font-semibold text-sm hover:bg-gray-700/50 rounded-md transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {selectedTemplate.name}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 bg-gray-800 border border-gray-700 rounded-md shadow-lg"
        align="start"
      >
        {templates.map((template) => (
          <TooltipProvider key={template.id}>
            <Tooltip>
              <DropdownMenuItem
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                  selectedTemplate.id === template.id ? 'bg-gray-700' : ''
                }`}
                onClick={() => handleTemplateChange(template)}
                disabled={isLoading}
              >
                <span className="flex-1 text-sm font-medium">{template.name}</span>
                <div className="flex items-center gap-2">
                  <TooltipTrigger asChild>
                    <button 
                      className="p-1 rounded-full hover:bg-gray-600/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="h-4 w-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  {selectedTemplate.id === template.id && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </DropdownMenuItem>
              <TooltipContent 
                side="right" 
                className="max-w-sm bg-gray-800 border border-gray-700 p-3 rounded-md shadow-lg"
              >
                <div className="space-y-2">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-sm text-gray-300">{template.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplateSelector;