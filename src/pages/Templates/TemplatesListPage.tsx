import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/features/layout/components/MainLayout';
import type { Template } from '@/types';

const TemplatesListPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      isSidebarOpen={isSidebarOpen} 
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Templates</h1>
          <Button onClick={() => navigate('/templates/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>

        <Input
          type="search"
          placeholder="Search templates..."
          className="max-w-md mb-6"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => navigate(`/templates/${template.id}`)}
              >
                <h3 className="font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {template.content.substring(0, 100)}...
                </p>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                No templates found
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TemplatesListPage;