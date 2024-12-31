import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/features/layout/components/MainLayout';

const PatientsListPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  return (
    <MainLayout 
      isSidebarOpen={isSidebarOpen} 
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Patients</h1>
          <Button 
            onClick={() => navigate('/patients/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add New Patient
          </Button>
        </div>
        
        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Patient cards will be rendered here */}
          <div className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow">
            <p className="text-lg font-semibold">Example Patient</p>
            <p className="text-gray-600">DOB: 01/01/1980</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => navigate('/patients/123')}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientsListPage;