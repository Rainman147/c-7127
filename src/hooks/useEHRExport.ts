import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportData {
  type: 'SOAP' | 'Summary' | 'Referral';
  content: Record<string, unknown>;
}

interface ExportOptions {
  patientId?: string;
  chatId?: string;
  ehrSystem: string;
  data: ExportData;
}

export const useEHRExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToEHR = async (options: ExportOptions) => {
    setIsExporting(true);
    try {
      console.log('[useEHRExport] Starting export:', options);
      
      const { data, error } = await supabase.functions.invoke('export-to-ehr', {
        body: options
      });

      if (error) throw error;

      console.log('[useEHRExport] Export successful:', data);
      
      toast({
        description: "Successfully exported to EHR system",
        duration: 3000,
        className: "bg-green-500"
      });

      return data;
    } catch (error) {
      console.error('[useEHRExport] Export failed:', error);
      
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToEHR,
    isExporting
  };
};