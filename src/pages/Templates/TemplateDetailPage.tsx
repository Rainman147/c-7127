import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/features/layout/components/MainLayout';
import { Template, parseSupabaseJson } from '@/types';

const TemplateDetailPage = () => {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (templateId && templateId !== 'new') {
      fetchTemplate();
    } else {
      setTemplate({
        id: '',
        name: '',
        content: '',
        instructions: null,
        schema: null,
        priority_rules: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: ''
      });
      setIsLoading(false);
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Parse JSON fields
      const parsedTemplate: Template = {
        ...data,
        instructions: parseSupabaseJson(data.instructions),
        schema: parseSupabaseJson(data.schema),
        priority_rules: parseSupabaseJson(data.priority_rules),
      };

      setTemplate(parsedTemplate);
    } catch (error: any) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template?.name || !template?.content) {
      toast({
        title: "Validation Error",
        description: "Name and content are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const isNew = templateId === 'new';
      const { error } = isNew
        ? await supabase.from('templates').insert([template])
        : await supabase
            .from('templates')
            .update(template)
            .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Template ${isNew ? 'created' : 'updated'} successfully`,
      });

      if (isNew) {
        navigate('/templates');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout 
        isSidebarOpen={isSidebarOpen} 
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      isSidebarOpen={isSidebarOpen} 
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline"
            onClick={() => navigate('/templates')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {templateId === 'new' ? 'New Template' : 'Edit Template'}
          </h1>
        </div>

        <div className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Template Name
            </label>
            <Input
              value={template?.name || ''}
              onChange={(e) => setTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Enter template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Content
            </label>
            <Textarea
              value={template?.content || ''}
              onChange={(e) => setTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
              placeholder="Enter template content..."
              className="min-h-[200px]"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default TemplateDetailPage;