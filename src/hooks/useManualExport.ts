import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ManualExportOptions {
  patientId: string;
  summaryId: string;
  exportFormat: 'PDF' | 'DOC';
  destination: string;
}

export const useManualExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportSummary = async ({
    patientId,
    summaryId,
    exportFormat,
    destination
  }: ManualExportOptions) => {
    setIsExporting(true);
    console.log('Starting manual export:', {
      patientId,
      summaryId,
      exportFormat,
      destination
    });

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase.functions.invoke('manual-export', {
        body: {
          userId: userData.user.id,
          patientId,
          summaryId,
          exportFormat,
          destination
        }
      });

      if (error) throw error;

      console.log('Export successful:', data);
      toast({
        title: "Export Successful",
        description: "Your summary has been exported successfully.",
      });

      return data;
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export summary. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportSummary,
    isExporting
  };
};