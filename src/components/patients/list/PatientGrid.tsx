import { useEffect } from 'react';
import { useRealTime } from '@/contexts/RealTimeContext';
import { PatientCard } from "../PatientCard";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { logger, LogCategory } from '@/utils/logging';
import type { Patient } from "@/types/database/patients";

interface PatientGridProps {
  patients: Patient[];
  isLoading: boolean;
  onPatientClick: (patient: Patient) => void;
  onPatientDelete: (patientId: string) => void;
}

export const PatientGrid = ({
  patients,
  isLoading,
  onPatientClick,
  onPatientDelete,
}: PatientGridProps) => {
  const { subscribe, cleanup } = useRealTime();

  useEffect(() => {
    logger.debug(LogCategory.WEBSOCKET, 'PatientGrid', 'Setting up patient subscriptions');
    
    const channel = subscribe({
      schema: 'public',
      table: 'patients',
      event: '*',
      onMessage: (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'PatientGrid', 'Received patient update:', payload);
        // Handle patient updates through React Query invalidation
        // The usePatientManagement hook will automatically refetch
      },
      onError: (error) => {
        logger.error(LogCategory.WEBSOCKET, 'PatientGrid', 'Subscription error:', error);
      }
    });

    return () => {
      cleanup();
    };
  }, [subscribe, cleanup]);

  if (isLoading) {
    return (
      <div className="col-span-full text-center text-gray-400 py-8">
        <div className="animate-pulse">Loading patients...</div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="col-span-full text-center text-gray-400 py-8">
        <AlertCircle className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg mb-4">No patients found</p>
        <p className="text-sm mb-4">Try a different search or add a new patient</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onClick={() => onPatientClick(patient)}
          onDelete={() => onPatientDelete(patient.id)}
        />
      ))}
    </div>
  );
};