
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PatientInfo } from './components/PatientInfo';
import { PatientMedicalInfo } from './components/PatientMedicalInfo';
import { PatientChatHistory } from './components/PatientChatHistory';
import { Patient } from '@/types';
import { Loader2, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewPatientModal } from './components/NewPatient/NewPatientModal';
import { toFrontendPatient } from '@/utils/transforms';

interface PatientDetailPageProps {
  isNew?: boolean;
}

const PatientDetailPage = ({ isNew = false }: PatientDetailPageProps) => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [recentChats, setRecentChats] = useState([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isNew && patientId) {
      fetchPatientDetails();
      fetchPatientChats();
    }
  }, [patientId, isNew]);

  const fetchPatientDetails = async () => {
    try {
      console.log('[PatientDetailPage] Fetching patient details:', patientId);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setPatient(toFrontendPatient(data));
    } catch (error) {
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
      console.log('[PatientDetailPage] Fetching patient chats:', patientId);
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
      toast({
        title: "Error",
        description: "Failed to load patient chat history",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? 'New Patient' : 'Patient Details'}
        </h1>
        {!isNew && (
          <Button 
            onClick={() => setShowEditModal(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <PatientInfo patient={patient} isNew={isNew} />
        <PatientMedicalInfo patient={patient} isNew={isNew} />
      </div>
      
      {!isNew && <PatientChatHistory chats={recentChats} />}

      {showEditModal && (
        <NewPatientModal 
          open={showEditModal}
          onOpenChange={setShowEditModal}
          existingPatient={patient}
          onSuccess={() => {
            fetchPatientDetails();
            toast({
              title: "Success",
              description: "Patient details updated successfully",
            });
          }}
        />
      )}
    </div>
  );
};

export default PatientDetailPage;
