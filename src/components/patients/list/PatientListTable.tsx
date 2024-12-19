import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Patient } from '@/types/database/patients';

interface PatientListTableProps {
  patients: Patient[];
  isLoading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
}

export const PatientListTable = ({
  patients,
  isLoading,
  onEdit,
  onDelete
}: PatientListTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>{patient.name}</TableCell>
              <TableCell>
                {patient.dob ? format(new Date(patient.dob), 'MM/dd/yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                {(patient.contact_info as { phone: string })?.phone || 'N/A'}
              </TableCell>
              <TableCell>
                {(patient.contact_info as { email: string })?.email || 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(patient)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(patient.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                {isLoading ? "Loading..." : "No patients found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};