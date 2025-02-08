
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PersonalInfoFieldsProps {
  name: string;
  dob: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoFields = ({ 
  name, 
  dob,
  onChange 
}: PersonalInfoFieldsProps) => {
  // Calculate max date (today) and min date (120 years ago)
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Create a synthetic event to match the onChange prop type
    const syntheticEvent = {
      target: {
        name: 'dob',
        value: format(date, 'yyyy-MM-dd')
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  // Parse the date string to a Date object for the calendar
  const dateValue = dob ? new Date(dob) : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={onChange}
          placeholder="Enter patient's full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, 'MM/dd/yyyy') : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              disabled={(date) => date > today || date < minDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="hidden"
          id="dob"
          name="dob"
          value={dob}
          required
        />
      </div>
    </div>
  );
};
