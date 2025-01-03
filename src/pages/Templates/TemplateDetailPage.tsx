import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/types';

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
          .single();

        if (error) throw error;

        // Convert database template to UI template format
        const uiTemplate: Template = {
          id: data.id,
          name: data.name,
          description: data.name, // Use name as description for now
          systemInstructions: data.content || '',
          content: data.content,
          instructions: data.instructions,
          schema: data.schema,
          priority_rules: data.priority_rules,
          created_at: data.created_at,
          updated_at: data.updated_at,
          user_id: data.user_id
        };

        setTemplate(uiTemplate);
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
