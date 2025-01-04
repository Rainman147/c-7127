import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { NewPatientModal } from './components/NewPatient/NewPatientModal';

interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_history?: string;
}

const PatientsListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name');

      if (error) throw error;

      setPatients(data || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSuccess = () => {
    fetchPatients();
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Patient
        </Button>
      </div>
      
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="search"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow bg-white/5"
            >
              <h3 className="text-lg font-semibold mb-2">{patient.name}</h3>
              <p className="text-sm text-gray-400">DOB: {formatDate(patient.dob)}</p>
              {patient.medical_history && (
                <p className="text-sm text-gray-400 mt-1 truncate">
                  History: {patient.medical_history}
                </p>
              )}
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                View Details
              </Button>
            </div>
          ))}
          
          {filteredPatients.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-8 text-gray-400">
              No patients found
            </div>
          )}
        </div>
      )}

      <NewPatientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PatientsListPage;