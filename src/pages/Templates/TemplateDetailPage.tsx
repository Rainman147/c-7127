import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/features/layout/components/MainLayout';

const TemplateDetailPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const { templateId } = useParams();
  const navigate = useNavigate();

  const handleSave = () => {
    // Save template logic will be implemented here
    console.log('Saving template:', { templateName, templateContent });
  };

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
          >
            Back to Templates
          </Button>
          <h1 className="text-2xl font-bold">
            {templateId === 'new' ? 'Create New Template' : 'Edit Template'}
          </h1>
        </div>

        <div className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Template Content</label>
            <Textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              className="min-h-[300px]"
              placeholder="Enter template content..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Template
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/templates')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TemplateDetailPage;