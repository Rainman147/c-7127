import { useParams, useSearchParams } from 'react-router-dom';

export const usePatientParams = () => {
  const { patientId: routePatientId } = useParams();
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patient');

  const patientId = routePatientId || queryPatientId;
  const isValidPatientId = patientId && /^[0-9a-fA-F-]+$/.test(patientId);

  console.log('[usePatientParams] Current patient params:', {
    routePatientId,
    queryPatientId,
    isValidPatientId
  });

  return {
    patientId: isValidPatientId ? patientId : null,
    isValidPatientId
  };
};