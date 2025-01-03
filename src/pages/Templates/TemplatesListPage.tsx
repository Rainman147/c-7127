import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Template } from '@/components/template/types';
import { parseJsonField } from '@/components/template/types';

const TemplatesListPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*');

        if (error) throw error;

        // Convert database templates to UI template format
        const uiTemplates: Template[] = data.map(dbTemplate => ({
          id: dbTemplate.id,
          name: dbTemplate.name,
          description: dbTemplate.name, // Use name as description for now
          systemInstructions: dbTemplate.content || '',
          content: dbTemplate.content,
          instructions: parseJsonField(dbTemplate.instructions),
          schema: parseJsonField(dbTemplate.schema),
          priority_rules: parseJsonField(dbTemplate.priority_rules),
          created_at: dbTemplate.created_at,
          updated_at: dbTemplate.updated_at,
          user_id: dbTemplate.user_id
        }));

        setTemplates(uiTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Templates</h1>
      {isLoading ? (
        <p>Loading templates...</p>
      ) : (
        <ul>
          {templates.map(template => (
            <li key={template.id} className="border-b py-2">
              <h2 className="text-lg">{template.name}</h2>
              <p>{template.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TemplatesListPage;