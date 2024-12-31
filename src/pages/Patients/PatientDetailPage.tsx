import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/features/layout/components/MainLayout';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Patient, parseSupabaseJson } from '@/types';
import { PatientInfo } from './components/PatientInfo';
import { PatientMedicalInfo } from './components/PatientMedicalInfo';
import { PatientChatHistory } from './components/PatientChatHistory';

const PatientDetailPage = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentChats, setRecentChats] = useState<Array<{
    id: string;
    title: string;
    created_at: string;
  }>>([]);
  
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

      // Parse JSON fields
      const parsedPatient: Patient = {
        ...data,
        contact_info: parseSupabaseJson(data.contact_info),
        current_medications: parseSupabaseJson(data.current_medications),
        recent_tests: parseSupabaseJson(data.recent_tests),
      };

      setPatient(parsedPatient);
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!patient) {
    return (
      <MainLayout>
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
    <MainLayout>
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
          <PatientInfo patient={patient} />
          <PatientMedicalInfo patient={patient} />
        </div>

        <PatientChatHistory chats={recentChats} />
      </div>
    </MainLayout>
  );
};

export default PatientDetailPage;