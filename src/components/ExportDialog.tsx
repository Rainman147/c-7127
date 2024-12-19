import { useState } from 'react';
import { useManualExport } from '@/hooks/useManualExport';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExportDialogProps {
  patientId: string;
  summaryId: string;
}

export function ExportDialog({ patientId, summaryId }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'DOC'>('PDF');
  const [destination, setDestination] = useState('');
  const { exportSummary, isExporting } = useManualExport();

  const handleExport = async () => {
    try {
      await exportSummary({
        patientId,
        summaryId,
        exportFormat,
        destination
      });
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Export Summary</Button>
      </DialogTrigger>
      <DialogContent className="menu-dialog">
        <DialogHeader className="menu-dialog-header">
          <DialogTitle className="menu-dialog-title">Export Summary</DialogTitle>
          <DialogDescription className="text-white/70">
            Choose your export format and destination.
          </DialogDescription>
        </DialogHeader>
        <div className="menu-dialog-content">
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format
              </Label>
              <Select
                value={exportFormat}
                onValueChange={(value: 'PDF' | 'DOC') => setExportFormat(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="menu-box">
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOC">DOC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="destination" className="text-right">
                Email
              </Label>
              <Input
                id="destination"
                type="email"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="col-span-3"
                placeholder="Enter email address"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="menu-dialog-content border-t border-white/[0.05]">
          <Button 
            type="submit" 
            onClick={handleExport} 
            disabled={isExporting || !destination}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}