import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/features/layout/components/MainLayout';

const TemplatesListPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <MainLayout 
      isSidebarOpen={isSidebarOpen} 
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Templates</h1>
          <Button 
            onClick={() => navigate('/templates/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create New Template
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Template cards */}
          <div className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold">SOAP Note</h3>
            <p className="text-gray-600 mb-4">Standard SOAP note template for patient visits</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/templates/123')}
              >
                Edit
              </Button>
              <Button>Use Template</Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TemplatesListPage;