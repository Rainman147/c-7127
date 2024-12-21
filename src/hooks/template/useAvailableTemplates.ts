import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultTemplates, mergeTemplates } from "@/components/template/templateTypes";
import type { Template } from "@/components/template/templateTypes";

export const useAvailableTemplates = () => {
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>(defaultTemplates);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: dbTemplates, error } = await supabase
          .from('templates')
          .select('*');

        if (error) throw error;

        console.log('[useAvailableTemplates] Fetched templates from DB:', dbTemplates);
        const merged = mergeTemplates(dbTemplates || []);
        setAvailableTemplates(merged);
      } catch (error) {
        console.error('[useAvailableTemplates] Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  return availableTemplates;
};
