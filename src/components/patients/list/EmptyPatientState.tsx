import { AlertCircle } from "lucide-react";

export const EmptyPatientState = () => {
  return (
    <div className="col-span-full text-center text-gray-400 py-8">
      <AlertCircle className="mx-auto h-12 w-12 mb-4" />
      <p className="text-lg mb-4">No patients found</p>
      <p className="text-sm mb-4">Try a different search or add a new patient</p>
    </div>
  );
};