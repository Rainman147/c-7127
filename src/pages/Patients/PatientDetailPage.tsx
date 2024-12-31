import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/features/layout/components/MainLayout';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_history?: string;
  contact_info?: {
    phone?: string;
    email?: string;
  };
  address?: string;
  current_medications?: string[];
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

const PatientDetailPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchPatientChats();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error: any) {
      console.error('Error fetching patient details:', error);
      toast({
        title: "Error",
        description: "Failed to load patient details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatientChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentChats(data || []);
    } catch (error) {
      console.error('Error fetching patient chats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!patient) {
    return (
      <MainLayout 
        isSidebarOpen={isSidebarOpen} 
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
            <Button onClick={() => navigate('/patients')}>
              Return to Patients List
            </Button>
          </div>
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
            onClick={() => navigate('/patients')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="p-4 border rounded-lg bg-white/5">
              <p><strong>Date of Birth:</strong> {formatDate(patient.dob)}</p>
              {patient.contact_info?.phone && (
                <p><strong>Phone:</strong> {patient.contact_info.phone}</p>
              )}
              {patient.contact_info?.email && (
                <p><strong>Email:</strong> {patient.contact_info.email}</p>
              )}
              {patient.address && (
                <p><strong>Address:</strong> {patient.address}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Medical Information</h2>
            <div className="p-4 border rounded-lg bg-white/5">
              {patient.medical_history && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Medical History</h3>
                  <p>{patient.medical_history}</p>
                </div>
              )}
              {patient.current_medications && patient.current_medications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Current Medications</h3>
                  <ul className="list-disc pl-4">
                    {patient.current_medications.map((med, index) => (
                      <li key={index}>{med}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Chat Sessions</h2>
          <div className="space-y-2">
            {recentChats.map((chat) => (
              <div 
                key={chat.id}
                className="p-4 border rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <p className="font-medium">{chat.title}</p>
                <p className="text-sm text-gray-400">
                  {new Date(chat.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {recentChats.length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No chat sessions found
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientDetailPage;