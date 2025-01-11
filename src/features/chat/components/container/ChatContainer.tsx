import { useState, useEffect } from 'react';
import { useUI } from '@/contexts/UIContext';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { formatPatientContext } from '@/types/patient';
import { useTemplateContextQueries } from '@/hooks/queries/useTemplateContextQueries';
import { formatSystemContext } from '@/utils/contextFormatter';
import type { Message, Template, PatientContext } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (content: string, type?: 'text' | 'audio', systemInstructions?: string) => Promise<void>;
  onTranscriptionComplete: (text: string) => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onPatientSelect: (patientId: string | null) => Promise<void>;
  selectedPatientId: string | null;
}

const ChatContainer = ({ 
  messages, 
  isLoading,
  currentChatId,
  onMessageSend,
  onTranscriptionComplete,
  onTemplateChange,
  onPatientSelect,
  selectedPatientId
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages, 'currentChatId:', currentChatId);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
  
  const { currentContext, createContext } = useTemplateContextQueries(currentChatId);

  const handleTranscriptionUpdate = (text: string) => {
    console.log('[ChatContainer] Transcription update:', text);
    setTranscriptionText(text);
  };

  const handleTemplateChange = async (template: Template) => {
    console.log('[ChatContainer] Template change:', template.name);
    onTemplateChange(template);
    
    if (currentChatId) {
      const formattedContext = formatSystemContext(template, patientContext);
      await createContext({ 
        template,
        patientId: selectedPatientId,
        systemPrompt: formattedContext.systemInstructions // Changed from systemInstructions to systemPrompt
      });
    }
  };

  // Fetch and format patient context when selectedPatientId changes
  useEffect(() => {
    const loadPatientContext = async () => {
      if (!selectedPatientId) {
        setPatientContext(null);
        return;
      }

      try {
        const { data: patient, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', selectedPatientId)
          .single();

        if (error) throw error;

        const formattedContext = formatPatientContext(patient);
        console.log('[ChatContainer] Loaded patient context:', formattedContext);
        setPatientContext(formattedContext);
      } catch (err) {
        console.error('[ChatContainer] Error loading patient context:', err);
        setPatientContext(null);
      }
    };

    loadPatientContext();
  }, [selectedPatientId]);

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          currentChatId={currentChatId} 
          onTemplateChange={handleTemplateChange}
          onPatientSelect={onPatientSelect}
          selectedPatientId={selectedPatientId}
        />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full relative">
            <div className="absolute inset-0 overflow-y-auto chat-scrollbar">
              <div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8">
                <div className="pt-[60px] pb-[100px]">
                  <MessageList messages={messages} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
          <div className="px-4 sm:px-6 md:px-8">
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSend={(content, type) => {
                  const formattedContext = formatSystemContext(
                    currentContext?.templateData || null, 
                    patientContext
                  );
                  onMessageSend(
                    content, 
                    type, 
                    formattedContext.systemInstructions
                  );
                }}
                onTranscriptionComplete={onTranscriptionComplete}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;