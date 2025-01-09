import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { parseJsonField } from '@/types/template/utils';
import type { Template } from '@/types/template';

const TemplateDetailPage = () => {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return;
      
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('id', templateId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Convert database template to UI template format
          const uiTemplate: Template = {
            id: data.id,
            name: data.name,
            description: data.description,
            systemInstructions: data.system_instructions || '',
            content: data.content,
            instructions: parseJsonField(data.instructions),
            schema: parseJsonField(data.schema),
            priority_rules: parseJsonField(data.priority_rules),
            created_at: data.created_at,
            updated_at: data.updated_at,
            user_id: data.user_id
          };
          setTemplate(uiTemplate);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  return (
    <div>
      <h1>{template.name}</h1>
      <p>{template.description}</p>
      <pre>{template.systemInstructions}</pre>
    </div>
  );
};

export default TemplateDetailPage;