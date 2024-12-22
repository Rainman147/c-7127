import { PatientDialog } from "@/components/patients/PatientDialog";
import { PatientListHeader } from "@/components/patients/list/PatientListHeader";
import { PatientSearch } from "@/components/patients/list/PatientSearch";
import { PatientGrid } from "@/components/patients/list/PatientGrid";
import { SidebarToggle } from "@/components/SidebarToggle";
import { usePatientPage } from "@/hooks/usePatientPage";
import { useEffect } from "react";

const PatientsPage = () => {
  const {
    searchQuery,
    patients,
    isLoading,
    isInitialLoad,
    isDialogOpen,
    selectedPatient,
    handleSearch,
    handlePatientClick,
    handleDeletePatient,
    handlePatientAdded,
    setIsDialogOpen,
  } = usePatientPage();

  useEffect(() => {
    console.log('[PatientsPage] Mounted with state:', {
      patientsCount: patients?.length,
      isLoading,
      isInitialLoad,
      isDialogOpen
    });
  }, [patients, isLoading, isInitialLoad, isDialogOpen]);

  return (
    <>
      <SidebarToggle />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PatientListHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onPatientAdded={handlePatientAdded}
        />

        <PatientSearch 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
        />

        <PatientGrid
          patients={patients}
          isLoading={isLoading || isInitialLoad}
          onPatientClick={handlePatientClick}
          onPatientDelete={handleDeletePatient}
        />

        <PatientDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          patient={selectedPatient}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handlePatientAdded}
        />
      </div>
    </>
  );
};

export default PatientsPage;