import { usePatientCreate } from './patient/usePatientCreate';
import { usePatientUpdate } from './patient/usePatientUpdate';
import { usePatientSearch } from './patient/usePatientSearch';
import { usePatientDelete } from './patient/usePatientDelete';
import { usePatientDetails } from './patient/usePatientDetails';

export const usePatientManagement = () => {
  const { isLoading: isCreating, addPatient } = usePatientCreate();
  const { isLoading: isUpdating, updatePatient } = usePatientUpdate();
  const { isLoading: isSearching, searchPatients } = usePatientSearch();
  const { isLoading: isDeleting, deletePatient } = usePatientDelete();
  const { isLoading: isFetching, getPatient } = usePatientDetails();

  const isLoading = isCreating || isUpdating || isSearching || isDeleting || isFetching;

  return {
    isLoading,
    addPatient,
    updatePatient,
    searchPatients,
    getPatient,
    deletePatient
  };
};