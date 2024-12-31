import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/features/layout/components/MainLayout';

const PatientDetailPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { patientId } = useParams();
  const navigate = useNavigate();

  return (
    <MainLayout 
      isSidebarOpen={isSidebarOpen} 
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
    >
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline"
            onClick={() => navigate('/patients')}
          >
            Back to Patients
          </Button>
          <h1 className="text-2xl font-bold">Patient Details</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="p-4 border rounded-lg">
              <p><strong>Name:</strong> John Doe</p>
              <p><strong>DOB:</strong> 01/01/1980</p>
              <p><strong>Contact:</strong> (555) 123-4567</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Medical History</h2>
            <div className="p-4 border rounded-lg">
              <p>Medical history details will be displayed here</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Chat Sessions</h2>
          <div className="space-y-2">
            {/* Chat sessions will be listed here */}
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <p className="font-medium">Session from 2024-01-01</p>
              <p className="text-gray-600">Click to view details</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientDetailPage;