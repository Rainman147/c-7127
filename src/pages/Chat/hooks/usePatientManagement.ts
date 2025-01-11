import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePatientManagement = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get('patientId');
    
    if (patientId !== selectedPatientId) {
      setSelectedPatientId(patientId);
      console.log('[usePatientManagement] Updated selected patient:', patientId);
    }
  }, [location.search, selectedPatientId]);

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[usePatientManagement] Patient selection changed:', patientId);
    setSelectedPatientId(patientId);
    
    const params = new URLSearchParams(location.search);
    if (patientId) {
      params.set('patientId', patientId);
    } else {
      params.delete('patientId');
    }
  };

  return {
    selectedPatientId,
    handlePatientSelect
  };
};